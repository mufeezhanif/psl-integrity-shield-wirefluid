// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MatchOracle.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract AnomalyTracker is ReentrancyGuard, Pausable {
    struct Flag { uint256 matchId; address flagger; string reason; uint256 stake; uint256 votesFor; uint256 votesAgainst; uint256 voterCount; bool resolved; bool upheld; }

    MatchOracle public matchOracle;
    uint256 public flagCount;
    uint256 public minFlagStake = 0.01 ether;
    uint256 public quorum = 3;

    mapping(uint256 => Flag) public flags;
    mapping(uint256 => uint256) public integrityScores;
    mapping(uint256 => bool) public integrityInitialized;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voteStakes;
    mapping(uint256 => mapping(address => bool)) public voteStakeWithdrawn;
    mapping(uint256 => bool) public certifiedClean;
    address public owner;

    event FlagRaised(uint256 indexed flagId, uint256 indexed matchId, address indexed flagger, string reason, uint256 stake);
    event VoteCast(uint256 indexed flagId, address indexed voter, bool support, uint256 weight);
    event FlagResolved(uint256 indexed flagId, bool upheld);
    event IntegrityScoreUpdated(uint256 indexed matchId, uint256 newScore);
    event CleanMatchCertified(uint256 indexed matchId, uint256 finalScore);
    event VoteStakeWithdrawn(uint256 indexed flagId, address indexed voter, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    constructor(address _matchOracle) { require(_matchOracle != address(0), "Invalid oracle address"); matchOracle = MatchOracle(_matchOracle); owner = msg.sender; }

    function raiseFlag(uint256 matchId, string calldata reason) external payable nonReentrant whenNotPaused {
        require(matchOracle.getMatchState(matchId) == MatchOracle.MatchState.Completed, "Match not Completed");
        require(msg.value >= minFlagStake, "Insufficient flag stake"); require(bytes(reason).length > 0, "Empty reason");
        _initIntegrity(matchId); flagCount++;
        flags[flagCount] = Flag({ matchId: matchId, flagger: msg.sender, reason: reason, stake: msg.value, votesFor: 0, votesAgainst: 0, voterCount: 0, resolved: false, upheld: false });
        emit FlagRaised(flagCount, matchId, msg.sender, reason, msg.value);
    }

    function voteOnFlag(uint256 flagId, bool support) external payable nonReentrant whenNotPaused {
        Flag storage f = flags[flagId];
        require(f.stake > 0, "Flag does not exist"); require(!f.resolved, "Flag already resolved");
        require(!hasVoted[flagId][msg.sender], "Already voted"); require(msg.value > 0, "Must stake to vote");
        require(msg.sender != f.flagger, "Flagger cannot vote");
        hasVoted[flagId][msg.sender] = true; voteStakes[flagId][msg.sender] = msg.value; f.voterCount++;
        if (support) { f.votesFor += msg.value; } else { f.votesAgainst += msg.value; }
        emit VoteCast(flagId, msg.sender, support, msg.value);
    }

    function resolveFlag(uint256 flagId) external nonReentrant {
        Flag storage f = flags[flagId];
        require(f.stake > 0, "Flag does not exist"); require(!f.resolved, "Already resolved");
        require(f.voterCount >= quorum, "Quorum not reached"); f.resolved = true;
        if (f.votesFor > f.votesAgainst) {
            f.upheld = true;
            (bool sent, ) = payable(f.flagger).call{value: f.stake}(""); require(sent, "Stake return failed");
            _initIntegrity(f.matchId);
            uint256 c = integrityScores[f.matchId]; integrityScores[f.matchId] = c > 10 ? c - 10 : 0;
            emit IntegrityScoreUpdated(f.matchId, integrityScores[f.matchId]);
        } else { f.upheld = false; }
        emit FlagResolved(flagId, f.upheld);
    }

    function certifyMatch(uint256 matchId) external {
        require(matchOracle.getMatchState(matchId) == MatchOracle.MatchState.Completed, "Match not Completed");
        require(!certifiedClean[matchId], "Already certified");
        _initIntegrity(matchId); uint256 score = integrityScores[matchId];
        require(score >= 90, "Score too low for certification");
        certifiedClean[matchId] = true; emit CleanMatchCertified(matchId, score);
    }

    function getIntegrityScore(uint256 matchId) external view returns (uint256) { return integrityInitialized[matchId] ? integrityScores[matchId] : 100; }
    function isMatchCertified(uint256 matchId) external view returns (bool) { return certifiedClean[matchId]; }

    function withdrawVoteStake(uint256 flagId) external nonReentrant {
        Flag storage f = flags[flagId];
        require(f.resolved, "Flag not resolved");
        require(hasVoted[flagId][msg.sender], "Not a voter");
        require(!voteStakeWithdrawn[flagId][msg.sender], "Already withdrawn");
        uint256 amount = voteStakes[flagId][msg.sender];
        require(amount > 0, "No stake");
        voteStakeWithdrawn[flagId][msg.sender] = true;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdraw failed");
        emit VoteStakeWithdrawn(flagId, msg.sender, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function withdrawSlashedFunds() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "No funds");
        (bool sent, ) = payable(owner).call{value: bal}("");
        require(sent, "Withdraw failed");
        emit FundsWithdrawn(owner, bal);
    }

    function getFlag(uint256 flagId) external view returns (uint256 matchId, address flagger, string memory reason, uint256 stake, uint256 votesFor, uint256 votesAgainst, uint256 voterCount, bool resolved, bool upheld) {
        Flag storage fl = flags[flagId]; return (fl.matchId, fl.flagger, fl.reason, fl.stake, fl.votesFor, fl.votesAgainst, fl.voterCount, fl.resolved, fl.upheld);
    }

    function _initIntegrity(uint256 matchId) internal { if (!integrityInitialized[matchId]) { integrityScores[matchId] = 100; integrityInitialized[matchId] = true; } }
}
