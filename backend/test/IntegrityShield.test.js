const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PSL Integrity Shield", function () {
  let matchOracle, predictionEngine, anomalyTracker;
  let owner, reporter, fan1, fan2, fan3;

  beforeEach(async function () {
    [owner, reporter, fan1, fan2, fan3] = await ethers.getSigners();

    const MO = await ethers.getContractFactory("MatchOracle");
    matchOracle = await MO.deploy();
    await matchOracle.waitForDeployment();

    const PE = await ethers.getContractFactory("PredictionEngine");
    predictionEngine = await PE.deploy(await matchOracle.getAddress());
    await predictionEngine.waitForDeployment();

    const AT = await ethers.getContractFactory("AnomalyTracker");
    anomalyTracker = await AT.deploy(await matchOracle.getAddress());
    await anomalyTracker.waitForDeployment();
  });

  // ══════════════════════════════════════════════════════════════════
  // MatchOracle Tests
  // ══════════════════════════════════════════════════════════════════

  describe("MatchOracle", function () {
    it("should create a match", async function () {
      await expect(matchOracle.createMatch(1, "Lahore Qalandars", "Islamabad United"))
        .to.emit(matchOracle, "MatchCreated")
        .withArgs(1, "Lahore Qalandars", "Islamabad United");

      const m = await matchOracle.getMatch(1);
      expect(m.team1).to.equal("Lahore Qalandars");
      expect(m.team2).to.equal("Islamabad United");
      expect(m.state).to.equal(0); // Upcoming
      expect(m.eventCount).to.equal(0);
    });

    it("should reject duplicate match IDs", async function () {
      await matchOracle.createMatch(1, "LQ", "IU");
      await expect(matchOracle.createMatch(1, "KK", "PZ"))
        .to.be.revertedWith("Match already exists");
    });

    it("should reject empty team names", async function () {
      await expect(matchOracle.createMatch(1, "", "IU"))
        .to.be.revertedWith("Empty team name");
    });

    it("should only allow owner to create matches", async function () {
      await expect(matchOracle.connect(fan1).createMatch(1, "LQ", "IU"))
        .to.be.revertedWithCustomError(matchOracle, "OwnableUnauthorizedAccount");
    });

    it("should register reporter with correct stake", async function () {
      const stake = ethers.parseEther("0.01");
      await expect(matchOracle.connect(reporter).registerReporter({ value: stake }))
        .to.emit(matchOracle, "ReporterRegistered")
        .withArgs(reporter.address, stake);

      expect(await matchOracle.registeredReporters(reporter.address)).to.be.true;
      expect(await matchOracle.reporterStakes(reporter.address)).to.equal(stake);
    });

    it("should reject insufficient stake", async function () {
      await expect(
        matchOracle.connect(reporter).registerReporter({ value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("Insufficient stake");
    });

    it("should reject double registration", async function () {
      const stake = ethers.parseEther("0.01");
      await matchOracle.connect(reporter).registerReporter({ value: stake });
      await expect(
        matchOracle.connect(reporter).registerReporter({ value: stake })
      ).to.be.revertedWith("Already registered");
    });

    it("should submit events only during Live state", async function () {
      await matchOracle.createMatch(1, "LQ", "IU");
      await matchOracle.connect(reporter).registerReporter({ value: ethers.parseEther("0.01") });

      const eventHash = ethers.keccak256(ethers.toUtf8Bytes("test-event"));

      // Should fail in Upcoming state
      await expect(matchOracle.connect(reporter).submitEvent(1, eventHash))
        .to.be.revertedWith("Match not Live");

      // Start match — should succeed
      await matchOracle.startMatch(1);
      await expect(matchOracle.connect(reporter).submitEvent(1, eventHash))
        .to.emit(matchOracle, "EventSubmitted")
        .withArgs(1, reporter.address, eventHash, 0);

      // End match — should fail again
      await matchOracle.endMatch(1);
      await expect(matchOracle.connect(reporter).submitEvent(1, eventHash))
        .to.be.revertedWith("Match not Live");
    });

    it("should enforce state transitions", async function () {
      await matchOracle.createMatch(1, "LQ", "IU");

      // Can't end before starting
      await expect(matchOracle.endMatch(1))
        .to.be.revertedWith("Match not in Live state");

      // Start
      await matchOracle.startMatch(1);

      // Can't start again
      await expect(matchOracle.startMatch(1))
        .to.be.revertedWith("Match not in Upcoming state");

      // End
      await matchOracle.endMatch(1);

      // Can't end again
      await expect(matchOracle.endMatch(1))
        .to.be.revertedWith("Match not in Live state");
    });

    it("should slash reporter", async function () {
      const stake = ethers.parseEther("0.01");
      await matchOracle.connect(reporter).registerReporter({ value: stake });

      await expect(matchOracle.slashReporter(reporter.address))
        .to.emit(matchOracle, "ReporterSlashed")
        .withArgs(reporter.address, stake);

      expect(await matchOracle.registeredReporters(reporter.address)).to.be.false;
      expect(await matchOracle.reporterStakes(reporter.address)).to.equal(0);
    });

    it("should increment matchCount", async function () {
      expect(await matchOracle.matchCount()).to.equal(0);
      await matchOracle.createMatch(1, "LQ", "IU");
      expect(await matchOracle.matchCount()).to.equal(1);
      await matchOracle.createMatch(2, "KK", "PZ");
      expect(await matchOracle.matchCount()).to.equal(2);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // PredictionEngine Tests
  // ══════════════════════════════════════════════════════════════════

  describe("PredictionEngine", function () {
    const salt = ethers.randomBytes(32);
    const winner = "Lahore Qalandars";
    const runs = 180;

    let commitHash;

    beforeEach(async function () {
      await matchOracle.createMatch(1, "Lahore Qalandars", "Islamabad United");
      commitHash = ethers.keccak256(
        ethers.solidityPacked(["string", "uint256", "bytes32"], [winner, runs, salt])
      );
    });

    it("should accept commit before match starts", async function () {
      await expect(predictionEngine.connect(fan1).commitPrediction(1, commitHash))
        .to.emit(predictionEngine, "PredictionCommitted")
        .withArgs(1, fan1.address);
    });

    it("should reject commit after match starts", async function () {
      await matchOracle.startMatch(1);
      await expect(predictionEngine.connect(fan1).commitPrediction(1, commitHash))
        .to.be.revertedWith("Match not in Upcoming state");
    });

    it("should reject double commit", async function () {
      await predictionEngine.connect(fan1).commitPrediction(1, commitHash);
      await expect(predictionEngine.connect(fan1).commitPrediction(1, commitHash))
        .to.be.revertedWith("Already committed");
    });

    it("should reject empty hash", async function () {
      await expect(
        predictionEngine.connect(fan1).commitPrediction(1, ethers.ZeroHash)
      ).to.be.revertedWith("Empty hash");
    });

    it("should validate reveal hash correctly", async function () {
      // Commit
      await predictionEngine.connect(fan1).commitPrediction(1, commitHash);

      // Start and end match
      await matchOracle.startMatch(1);
      await matchOracle.endMatch(1);

      // Reveal
      await expect(predictionEngine.connect(fan1).revealPrediction(1, winner, runs, salt))
        .to.emit(predictionEngine, "PredictionRevealed")
        .withArgs(1, fan1.address, winner, runs);

      // Check aggregation
      const [totalCommits, totalReveals, totalPredictedRuns] =
        await predictionEngine.getAggregatedResults(1);
      expect(totalCommits).to.equal(1);
      expect(totalReveals).to.equal(1);
      expect(totalPredictedRuns).to.equal(runs);
    });

    it("should reject wrong salt", async function () {
      await predictionEngine.connect(fan1).commitPrediction(1, commitHash);
      await matchOracle.startMatch(1);
      await matchOracle.endMatch(1);

      const wrongSalt = ethers.randomBytes(32);
      await expect(predictionEngine.connect(fan1).revealPrediction(1, winner, runs, wrongSalt))
        .to.be.revertedWith("Hash mismatch - invalid reveal");
    });

    it("should reject reveal before match is completed", async function () {
      await predictionEngine.connect(fan1).commitPrediction(1, commitHash);
      // Match still in Upcoming state
      await expect(predictionEngine.connect(fan1).revealPrediction(1, winner, runs, salt))
        .to.be.revertedWith("Match not Completed");
    });

    it("should reject double reveal", async function () {
      await predictionEngine.connect(fan1).commitPrediction(1, commitHash);
      await matchOracle.startMatch(1);
      await matchOracle.endMatch(1);

      await predictionEngine.connect(fan1).revealPrediction(1, winner, runs, salt);
      await expect(predictionEngine.connect(fan1).revealPrediction(1, winner, runs, salt))
        .to.be.revertedWith("Already revealed");
    });

    it("should track winner votes correctly", async function () {
      // Fan1 predicts LQ
      const salt1 = ethers.randomBytes(32);
      const hash1 = ethers.keccak256(
        ethers.solidityPacked(["string", "uint256", "bytes32"], ["Lahore Qalandars", 180, salt1])
      );
      await predictionEngine.connect(fan1).commitPrediction(1, hash1);

      // Fan2 predicts IU
      const salt2 = ethers.randomBytes(32);
      const hash2 = ethers.keccak256(
        ethers.solidityPacked(["string", "uint256", "bytes32"], ["Islamabad United", 160, salt2])
      );
      await predictionEngine.connect(fan2).commitPrediction(1, hash2);

      await matchOracle.startMatch(1);
      await matchOracle.endMatch(1);

      await predictionEngine.connect(fan1).revealPrediction(1, "Lahore Qalandars", 180, salt1);
      await predictionEngine.connect(fan2).revealPrediction(1, "Islamabad United", 160, salt2);

      expect(await predictionEngine.getWinnerVotes(1, "Lahore Qalandars")).to.equal(1);
      expect(await predictionEngine.getWinnerVotes(1, "Islamabad United")).to.equal(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // AnomalyTracker Tests
  // ══════════════════════════════════════════════════════════════════

  describe("AnomalyTracker", function () {
    const flagStake = ethers.parseEther("0.01");
    const voteStake = ethers.parseEther("0.005");

    beforeEach(async function () {
      await matchOracle.createMatch(1, "Lahore Qalandars", "Islamabad United");
      await matchOracle.startMatch(1);
      await matchOracle.endMatch(1);
    });

    it("should raise flag with stake on completed match", async function () {
      await expect(
        anomalyTracker.connect(fan1).raiseFlag(1, "Suspicious bowling figures", { value: flagStake })
      )
        .to.emit(anomalyTracker, "FlagRaised")
        .withArgs(1, 1, fan1.address, "Suspicious bowling figures", flagStake);

      expect(await anomalyTracker.flagCount()).to.equal(1);
    });

    it("should reject flag on non-completed match", async function () {
      await matchOracle.createMatch(2, "KK", "PZ");
      await expect(
        anomalyTracker.connect(fan1).raiseFlag(2, "test", { value: flagStake })
      ).to.be.revertedWith("Match not Completed");
    });

    it("should reject flag with insufficient stake", async function () {
      await expect(
        anomalyTracker.connect(fan1).raiseFlag(1, "test", { value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("Insufficient flag stake");
    });

    it("should reject flag with empty reason", async function () {
      await expect(
        anomalyTracker.connect(fan1).raiseFlag(1, "", { value: flagStake })
      ).to.be.revertedWith("Empty reason");
    });

    it("should accept votes with stake", async function () {
      await anomalyTracker.connect(fan1).raiseFlag(1, "Suspicious", { value: flagStake });

      await expect(
        anomalyTracker.connect(fan2).voteOnFlag(1, true, { value: voteStake })
      )
        .to.emit(anomalyTracker, "VoteCast")
        .withArgs(1, fan2.address, true, voteStake);
    });

    it("should prevent double voting", async function () {
      await anomalyTracker.connect(fan1).raiseFlag(1, "Suspicious", { value: flagStake });
      await anomalyTracker.connect(fan2).voteOnFlag(1, true, { value: voteStake });
      await expect(
        anomalyTracker.connect(fan2).voteOnFlag(1, false, { value: voteStake })
      ).to.be.revertedWith("Already voted");
    });

    it("should prevent flagger from voting", async function () {
      await anomalyTracker.connect(fan1).raiseFlag(1, "Suspicious", { value: flagStake });
      await expect(
        anomalyTracker.connect(fan1).voteOnFlag(1, true, { value: voteStake })
      ).to.be.revertedWith("Flagger cannot vote");
    });

    it("should resolve upheld flag correctly", async function () {
      await anomalyTracker.connect(fan1).raiseFlag(1, "Suspicious", { value: flagStake });

      // 3 votes for (quorum = 3)
      await anomalyTracker.connect(fan2).voteOnFlag(1, true, { value: voteStake });
      await anomalyTracker.connect(fan3).voteOnFlag(1, true, { value: voteStake });
      await anomalyTracker.connect(owner).voteOnFlag(1, true, { value: voteStake });

      const flaggerBalBefore = await ethers.provider.getBalance(fan1.address);

      await expect(anomalyTracker.resolveFlag(1))
        .to.emit(anomalyTracker, "FlagResolved")
        .withArgs(1, true)
        .and.to.emit(anomalyTracker, "IntegrityScoreUpdated")
        .withArgs(1, 90);

      // Flagger should have received stake back
      const flaggerBalAfter = await ethers.provider.getBalance(fan1.address);
      expect(flaggerBalAfter).to.be.gt(flaggerBalBefore);

      // Integrity score should drop
      expect(await anomalyTracker.getIntegrityScore(1)).to.equal(90);
    });

    it("should slash rejected flag stake", async function () {
      await anomalyTracker.connect(fan1).raiseFlag(1, "Baseless claim", { value: flagStake });

      // 3 votes against
      await anomalyTracker.connect(fan2).voteOnFlag(1, false, { value: voteStake });
      await anomalyTracker.connect(fan3).voteOnFlag(1, false, { value: voteStake });
      await anomalyTracker.connect(owner).voteOnFlag(1, false, { value: voteStake });

      await expect(anomalyTracker.resolveFlag(1))
        .to.emit(anomalyTracker, "FlagResolved")
        .withArgs(1, false);

      // Integrity score should remain 100
      expect(await anomalyTracker.getIntegrityScore(1)).to.equal(100);
    });

    it("should reject resolve before quorum", async function () {
      await anomalyTracker.connect(fan1).raiseFlag(1, "Test", { value: flagStake });
      await anomalyTracker.connect(fan2).voteOnFlag(1, true, { value: voteStake });

      await expect(anomalyTracker.resolveFlag(1))
        .to.be.revertedWith("Quorum not reached");
    });

    it("should update integrity score on multiple upheld flags", async function () {
      // First flag — upheld
      await anomalyTracker.connect(fan1).raiseFlag(1, "Flag 1", { value: flagStake });
      await anomalyTracker.connect(fan2).voteOnFlag(1, true, { value: voteStake });
      await anomalyTracker.connect(fan3).voteOnFlag(1, true, { value: voteStake });
      await anomalyTracker.connect(owner).voteOnFlag(1, true, { value: voteStake });
      await anomalyTracker.resolveFlag(1);
      expect(await anomalyTracker.getIntegrityScore(1)).to.equal(90);

      // Second flag — upheld
      await anomalyTracker.connect(fan2).raiseFlag(1, "Flag 2", { value: flagStake });
      await anomalyTracker.connect(fan1).voteOnFlag(2, true, { value: voteStake });
      await anomalyTracker.connect(fan3).voteOnFlag(2, true, { value: voteStake });
      await anomalyTracker.connect(owner).voteOnFlag(2, true, { value: voteStake });
      await anomalyTracker.resolveFlag(2);
      expect(await anomalyTracker.getIntegrityScore(1)).to.equal(80);
    });

    it("should return 100 for uninitialized match", async function () {
      expect(await anomalyTracker.getIntegrityScore(999)).to.equal(100);
    });
  });
});
