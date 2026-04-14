// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MatchOracle.sol";

/**
 * @title PredictionEngine
 * @notice Commit-reveal prediction system for PSL matches.
 * Fans commit hashed predictions before a match starts, then reveal
 * after it completes. The contract validates reveals cryptographically
 * and aggregates crowd consensus as a baseline for anomaly detection.
 */
contract PredictionEngine {

    // ── Types ───────────────────────────────────────────────────────────

    struct Prediction {
        bytes32 commitHash;
        bool committed;
        bool revealed;
        string predictedWinner;
        uint256 predictedRuns;
    }

    struct MatchAggregation {
        uint256 totalCommits;
        uint256 totalReveals;
        uint256 totalPredictedRuns;
        string[] revealedWinners;
    }

    // ── State ───────────────────────────────────────────────────────────

    MatchOracle public matchOracle;

    /// matchId => user => Prediction
    mapping(uint256 => mapping(address => Prediction)) public predictions;

    /// matchId => aggregation data
    mapping(uint256 => MatchAggregation) internal _aggregations;

    /// matchId => winnerName => vote count
    mapping(uint256 => mapping(string => uint256)) public winnerVotes;

    // ── Events ──────────────────────────────────────────────────────────

    event PredictionCommitted(uint256 indexed matchId, address indexed predictor);
    event PredictionRevealed(
        uint256 indexed matchId,
        address indexed predictor,
        string winner,
        uint256 runs
    );

    // ── Constructor ─────────────────────────────────────────────────────

    constructor(address _matchOracle) {
        require(_matchOracle != address(0), "Invalid oracle address");
        matchOracle = MatchOracle(_matchOracle);
    }

    // ── Public Functions ────────────────────────────────────────────────

    /**
     * @notice Commit a hashed prediction for a match.
     * @dev Hash = keccak256(abi.encodePacked(winner, totalRuns, salt))
     *      Must be called while match is in Upcoming state.
     * @param matchId The match to predict
     * @param hash The keccak256 hash of (winner, totalRuns, salt)
     */
    function commitPrediction(uint256 matchId, bytes32 hash) external {
        require(
            matchOracle.getMatchState(matchId) == MatchOracle.MatchState.Upcoming,
            "Match not in Upcoming state"
        );
        require(!predictions[matchId][msg.sender].committed, "Already committed");
        require(hash != bytes32(0), "Empty hash");

        predictions[matchId][msg.sender] = Prediction({
            commitHash: hash,
            committed: true,
            revealed: false,
            predictedWinner: "",
            predictedRuns: 0
        });

        _aggregations[matchId].totalCommits++;

        emit PredictionCommitted(matchId, msg.sender);
    }

    /**
     * @notice Reveal a previously committed prediction.
     * @dev The contract recomputes the hash and validates against the stored commit.
     *      Must be called after match is Completed.
     * @param matchId The match
     * @param winner The predicted winning team name
     * @param runs The predicted total runs
     * @param salt The random salt used during commit
     */
    function revealPrediction(
        uint256 matchId,
        string calldata winner,
        uint256 runs,
        bytes32 salt
    ) external {
        require(
            matchOracle.getMatchState(matchId) == MatchOracle.MatchState.Completed,
            "Match not Completed"
        );

        Prediction storage pred = predictions[matchId][msg.sender];
        require(pred.committed, "No commitment found");
        require(!pred.revealed, "Already revealed");

        // Recompute hash and validate
        bytes32 recomputed = keccak256(abi.encodePacked(winner, runs, salt));
        require(recomputed == pred.commitHash, "Hash mismatch - invalid reveal");

        // Update prediction record
        pred.revealed = true;
        pred.predictedWinner = winner;
        pred.predictedRuns = runs;

        // Update aggregation
        MatchAggregation storage agg = _aggregations[matchId];
        agg.totalReveals++;
        agg.totalPredictedRuns += runs;
        agg.revealedWinners.push(winner);
        winnerVotes[matchId][winner]++;

        emit PredictionRevealed(matchId, msg.sender, winner, runs);
    }

    // ── View Functions ──────────────────────────────────────────────────

    /**
     * @notice Get aggregated prediction results for a match.
     */
    function getAggregatedResults(uint256 matchId)
        external
        view
        returns (
            uint256 totalCommits,
            uint256 totalReveals,
            uint256 totalPredictedRuns
        )
    {
        MatchAggregation storage agg = _aggregations[matchId];
        return (agg.totalCommits, agg.totalReveals, agg.totalPredictedRuns);
    }

    /**
     * @notice Get the vote count for a specific winner prediction.
     */
    function getWinnerVotes(uint256 matchId, string calldata winner)
        external
        view
        returns (uint256)
    {
        return winnerVotes[matchId][winner];
    }
}
