const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("---");

  // ── 1. Deploy MatchOracle ──────────────────────────────────────────
  const MatchOracle = await hre.ethers.getContractFactory("MatchOracle");
  const matchOracle = await MatchOracle.deploy();
  await matchOracle.waitForDeployment();
  const matchOracleAddr = await matchOracle.getAddress();
  console.log("MatchOracle deployed to:", matchOracleAddr);
  console.log("  tx hash:", matchOracle.deploymentTransaction().hash);

  // ── 2. Deploy PredictionEngine ─────────────────────────────────────
  const PredictionEngine = await hre.ethers.getContractFactory("PredictionEngine");
  const predictionEngine = await PredictionEngine.deploy(matchOracleAddr);
  await predictionEngine.waitForDeployment();
  const predictionEngineAddr = await predictionEngine.getAddress();
  console.log("PredictionEngine deployed to:", predictionEngineAddr);
  console.log("  tx hash:", predictionEngine.deploymentTransaction().hash);

  // ── 3. Deploy AnomalyTracker ───────────────────────────────────────
  const AnomalyTracker = await hre.ethers.getContractFactory("AnomalyTracker");
  const anomalyTracker = await AnomalyTracker.deploy(matchOracleAddr);
  await anomalyTracker.waitForDeployment();
  const anomalyTrackerAddr = await anomalyTracker.getAddress();
  console.log("AnomalyTracker deployed to:", anomalyTrackerAddr);
  console.log("  tx hash:", anomalyTracker.deploymentTransaction().hash);

  console.log("\n--- Sample Data Setup ---\n");

  // ── 4. Create sample PSL matches ───────────────────────────────────
  let tx;

  tx = await matchOracle.createMatch(1, "Lahore Qalandars", "Islamabad United");
  await tx.wait();
  console.log("Match 1 created (LQ vs IU):", tx.hash);

  tx = await matchOracle.createMatch(2, "Karachi Kings", "Peshawar Zalmi");
  await tx.wait();
  console.log("Match 2 created (KK vs PZ):", tx.hash);

  tx = await matchOracle.createMatch(3, "Multan Sultans", "Quetta Gladiators");
  await tx.wait();
  console.log("Match 3 created (MS vs QG):", tx.hash);

  // ── 5. Register deployer as reporter ───────────────────────────────
  tx = await matchOracle.registerReporter({ value: hre.ethers.parseEther("0.01") });
  await tx.wait();
  console.log("Reporter registered:", tx.hash);

  // ── 6. Start Match 1, submit events, end Match 1 ──────────────────
  tx = await matchOracle.startMatch(1);
  await tx.wait();
  console.log("Match 1 started:", tx.hash);

  // Submit sample event hashes (simulating ball-by-ball data)
  const sampleEvents = [
    hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Over1.Ball1:LQ:4runs")),
    hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Over1.Ball2:LQ:1run")),
    hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Over1.Ball3:LQ:wicket")),
  ];

  for (let i = 0; i < sampleEvents.length; i++) {
    tx = await matchOracle.submitEvent(1, sampleEvents[i]);
    await tx.wait();
    console.log(`Event ${i + 1} submitted:`, tx.hash);
  }

  tx = await matchOracle.endMatch(1);
  await tx.wait();
  console.log("Match 1 ended:", tx.hash);

  // ── 7. Summary ─────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("Network:           WireFluid Testnet (Chain 92533)");
  console.log("MatchOracle:      ", matchOracleAddr);
  console.log("PredictionEngine: ", predictionEngineAddr);
  console.log("AnomalyTracker:   ", anomalyTrackerAddr);
  console.log("========================================");
  console.log("\nCopy these addresses into frontend CONFIG object.");
  console.log("Share all tx hashes with Group B and Uzair immediately.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
