// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MatchOracle.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AnomalyTracker
 * @notice Community-governed integrity flagging system for PSL matches.
 * Anyone can flag a completed match by staking WIRE. The community votes
 * (stake-weighted). Upheld flags reduce the match's integrity score;
 * rejected flags lose the flagger's stake.
 */
contract AnomalyTracker is ReentrancyGuard {

    // ── Types ───────────────────────────────────────────────────────────

    struct Flag {
        uint256 matchId;
        address flagger;
        string reason;
        uint256 stake;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 voterCount;
        bool resolved;
        bool upheld;
    }

    // ── State ───────────────────────────────────────────────────────────

    MatchOracle public matchOracle;

    uint256 public flagCount;
    uint256 public minFlagStake = 0.01 ether;
    uint256 public quorum = 3;

    /// flagId => Flag
    mapping(uint256 => Flag) public flags;

    /// matchId => integrity score (default 100)
    mapping(uint256 => uint256) public integrityScores;

    /// matchId => whether integrity score has been initialized
    mapping(uint256 => bool) public integrityInitialized;

    /// flagId => voter => whether they have voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// flagId => voter => vote stake amount
    mapping(uint256 => mapping(address => uint256)) public voteStakes;

    // ── Events ──────────────────────────────────────────────────────────

    event FlagRaised(
        uint256 indexed flagId,
        uint256 indexed matchId,
        address indexed flagger,
        string reason,
        uint256 stake
    );
    event VoteCast(
        uint256 indexed flagId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event FlagResolved(uint256 indexed flagId, bool upheld);
    event IntegrityScoreUpdated(uint256 indexed matchId, uint256 newScore);

    // ── Constructor ─────────────────────────────────────────────────────

    constructor(address _matchOracle) {
        require(_matchOracle != address(0), "Invalid oracle address");
        matchOracle = MatchOracle(_matchOracle);
    }

    // ── Public Functions ────────────────────────────────────────────────

    /**
     * @notice Flag a completed match for suspected anomaly.
     * @param matchId The match to flag
     * @param reason Description of the suspected anomaly
     */
    function raiseFlag(uint256 matchId, string calldata reason) external payable nonReentrant {
        require(
            matchOracle.getMatchState(matchId) == MatchOracle.MatchState.Completed,
            "Match not Completed"
        );
        require(msg.value >= minFlagStake, "Insufficient flag stake");
        require(bytes(reason).length > 0, "Empty reason");

        // Initialize integrity score if first interaction
        _initIntegrity(matchId);

        flagCount++;
        flags[flagCount] = Flag({
            matchId: matchId,
            flagger: msg.sender,
            reason: reason,
            stake: msg.value,
            votesFor: 0,
            votesAgainst: 0,
            voterCount: 0,
            resolved: false,
            upheld: false
        });

        emit FlagRaised(flagCount, matchId, msg.sender, reason, msg.value);
    }

    /**
     * @notice Vote on an active flag. Requires staking WIRE.
     * @param flagId The flag to vote on
     * @param support True = agree with flag, False = oppose
     */
    function voteOnFlag(uint256 flagId, bool support) external payable nonReentrant {
        Flag storage flag = flags[flagId];
        require(flag.stake > 0, "Flag does not exist");
        require(!flag.resolved, "Flag already resolved");
        require(!hasVoted[flagId][msg.sender], "Already voted");
        require(msg.value > 0, "Must stake to vote");
        require(msg.sender != flag.flagger, "Flagger cannot vote");

        hasVoted[flagId][msg.sender] = true;
        voteStakes[flagId][msg.sender] = msg.value;
        flag.voterCount++;

        if (support) {
            flag.votesFor += msg.value;
        } else {
            flag.votesAgainst += msg.value;
        }

        emit VoteCast(flagId, msg.sender, support, msg.value);
    }

    /**
     * @notice Resolve a flag after quorum is reached.
     * @dev If upheld: flagger stake returned, integrity score drops.
     *      If rejected: flagger stake slashed (stays in contract).
     */
    function resolveFlag(uint256 flagId) external nonReentrant {
        Flag storage flag = flags[flagId];
        require(flag.stake > 0, "Flag does not exist");
        require(!flag.resolved, "Already resolved");
        require(flag.voterCount >= quorum, "Quorum not reached");

        flag.resolved = true;

        if (flag.votesFor > flag.votesAgainst) {
            // Flag UPHELD — return flagger's stake, reduce integrity score
            flag.upheld = true;

            // Return stake to flagger
            (bool sent, ) = payable(flag.flagger).call{value: flag.stake}("");
            require(sent, "Stake return failed");

            // Reduce integrity score
            uint256 matchId = flag.matchId;
            _initIntegrity(matchId);
            uint256 current = integrityScores[matchId];
            uint256 deduction = 10;
            if (current > deduction) {
                integrityScores[matchId] = current - deduction;
            } else {
                integrityScores[matchId] = 0;
            }

            emit IntegrityScoreUpdated(matchId, integrityScores[matchId]);
        } else {
            // Flag REJECTED — flagger's stake stays in contract (slashed)
            flag.upheld = false;
        }

        emit FlagResolved(flagId, flag.upheld);
    }

    // ── View Functions ──────────────────────────────────────────────────

    /**
     * @notice Get the integrity score for a match.
     * @dev Starts at 100, drops by 10 per upheld flag.
     */
    function getIntegrityScore(uint256 matchId) external view returns (uint256) {
        if (!integrityInitialized[matchId]) {
            return 100;
        }
        return integrityScores[matchId];
    }

    /**
     * @notice Get full details of a flag.
     */
    function getFlag(uint256 flagId)
        external
        view
        returns (
            uint256 matchId,
            address flagger,
            string memory reason,
            uint256 stake,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 voterCount,
            bool resolved,
            bool upheld
        )
    {
        Flag storage f = flags[flagId];
        return (
            f.matchId,
            f.flagger,
            f.reason,
            f.stake,
            f.votesFor,
            f.votesAgainst,
            f.voterCount,
            f.resolved,
            f.upheld
        );
    }

    // ── Internal Functions ──────────────────────────────────────────────

    function _initIntegrity(uint256 matchId) internal {
        if (!integrityInitialized[matchId]) {
            integrityScores[matchId] = 100;
            integrityInitialized[matchId] = true;
        }
    }
}
