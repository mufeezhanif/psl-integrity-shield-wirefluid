// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MatchOracle.sol";

contract PredictionEngine {
    struct Prediction { bytes32 commitHash; bool committed; bool revealed; string predictedWinner; uint256 predictedRuns; }
    struct MatchAggregation { uint256 totalCommits; uint256 totalReveals; uint256 totalPredictedRuns; string[] revealedWinners; }

    MatchOracle public matchOracle;
    mapping(uint256 => mapping(address => Prediction)) public predictions;
    mapping(uint256 => MatchAggregation) internal _aggregations;
    mapping(uint256 => mapping(string => uint256)) public winnerVotes;
    mapping(uint256 => uint256) public divergenceScores;
    mapping(uint256 => bool) public divergenceChecked;

    event PredictionCommitted(uint256 indexed matchId, address indexed predictor);
    event PredictionRevealed(uint256 indexed matchId, address indexed predictor, string winner, uint256 runs);
    event HighDivergenceDetected(uint256 indexed matchId, uint256 divergenceScore);

    constructor(address _matchOracle) { require(_matchOracle != address(0), "Invalid oracle address"); matchOracle = MatchOracle(_matchOracle); }

    function commitPrediction(uint256 matchId, bytes32 hash) external {
        require(matchOracle.getMatchState(matchId) == MatchOracle.MatchState.Upcoming, "Match not in Upcoming state");
        require(!predictions[matchId][msg.sender].committed, "Already committed");
        require(hash != bytes32(0), "Empty hash");
        predictions[matchId][msg.sender] = Prediction({ commitHash: hash, committed: true, revealed: false, predictedWinner: "", predictedRuns: 0 });
        _aggregations[matchId].totalCommits++;
        emit PredictionCommitted(matchId, msg.sender);
    }

    function revealPrediction(uint256 matchId, string calldata winner, uint256 runs, bytes32 salt) external {
        require(matchOracle.getMatchState(matchId) == MatchOracle.MatchState.Completed, "Match not Completed");
        Prediction storage pred = predictions[matchId][msg.sender];
        require(pred.committed, "No commitment found");
        require(!pred.revealed, "Already revealed");
        require(keccak256(abi.encodePacked(winner, runs, salt)) == pred.commitHash, "Hash mismatch - invalid reveal");
        pred.revealed = true; pred.predictedWinner = winner; pred.predictedRuns = runs;
        MatchAggregation storage agg = _aggregations[matchId];
        agg.totalReveals++; agg.totalPredictedRuns += runs; agg.revealedWinners.push(winner);
        winnerVotes[matchId][winner]++;
        emit PredictionRevealed(matchId, msg.sender, winner, runs);
    }

    function checkDivergence(uint256 matchId, string calldata actualWinner) external {
        require(matchOracle.getMatchState(matchId) == MatchOracle.MatchState.Completed, "Match not Completed");
        MatchAggregation storage agg = _aggregations[matchId];
        require(agg.totalReveals > 0, "No reveals");
        uint256 wv = winnerVotes[matchId][actualWinner];
        uint256 divergence = 100 - ((wv * 100) / agg.totalReveals);
        divergenceScores[matchId] = divergence; divergenceChecked[matchId] = true;
        if (divergence > 70) { emit HighDivergenceDetected(matchId, divergence); }
    }

    function getAggregatedResults(uint256 matchId) external view returns (uint256, uint256, uint256) {
        MatchAggregation storage a = _aggregations[matchId]; return (a.totalCommits, a.totalReveals, a.totalPredictedRuns);
    }
    function getWinnerVotes(uint256 matchId, string calldata winner) external view returns (uint256) { return winnerVotes[matchId][winner]; }
    function getDivergenceScore(uint256 matchId) external view returns (uint256) { return divergenceChecked[matchId] ? divergenceScores[matchId] : 0; }
}
