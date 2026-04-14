// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MatchOracle
 * @notice Immutable event ledger for PSL matches.
 * Staked reporters submit ball-by-ball event hashes during live matches.
 * Reports are timestamped on-chain and cannot be altered after submission.
 */
contract MatchOracle is Ownable, ReentrancyGuard {

    // ── Types ───────────────────────────────────────────────────────────

    enum MatchState { Upcoming, Live, Completed }

    struct Match {
        string team1;
        string team2;
        MatchState state;
        uint256 eventCount;
        uint256 createdAt;
    }

    // ── State ───────────────────────────────────────────────────────────

    uint256 public reporterStake = 0.01 ether;
    uint256 public matchCount;

    mapping(uint256 => Match) public matches;
    mapping(address => bool) public registeredReporters;
    mapping(address => uint256) public reporterStakes;
    mapping(uint256 => mapping(uint256 => bytes32)) public matchEvents;

    // ── Events ──────────────────────────────────────────────────────────

    event MatchCreated(uint256 indexed matchId, string team1, string team2);
    event ReporterRegistered(address indexed reporter, uint256 stake);
    event EventSubmitted(
        uint256 indexed matchId,
        address indexed reporter,
        bytes32 eventHash,
        uint256 eventIndex
    );
    event MatchStarted(uint256 indexed matchId);
    event MatchEnded(uint256 indexed matchId);
    event ReporterSlashed(address indexed reporter, uint256 amount);

    // ── Modifiers ───────────────────────────────────────────────────────

    modifier onlyReporter() {
        require(registeredReporters[msg.sender], "Not a registered reporter");
        _;
    }

    modifier matchExists(uint256 matchId) {
        require(matches[matchId].createdAt != 0, "Match does not exist");
        _;
    }

    // ── Constructor ─────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ── Admin Functions ─────────────────────────────────────────────────

    /**
     * @notice Create a new PSL match.
     * @param matchId Unique identifier for the match
     * @param team1 First team name (e.g. "Lahore Qalandars")
     * @param team2 Second team name (e.g. "Islamabad United")
     */
    function createMatch(
        uint256 matchId,
        string calldata team1,
        string calldata team2
    ) external onlyOwner {
        require(matches[matchId].createdAt == 0, "Match already exists");
        require(bytes(team1).length > 0 && bytes(team2).length > 0, "Empty team name");

        matches[matchId] = Match({
            team1: team1,
            team2: team2,
            state: MatchState.Upcoming,
            eventCount: 0,
            createdAt: block.timestamp
        });

        matchCount++;
        emit MatchCreated(matchId, team1, team2);
    }

    /**
     * @notice Transition match from Upcoming to Live.
     */
    function startMatch(uint256 matchId) external onlyOwner matchExists(matchId) {
        require(matches[matchId].state == MatchState.Upcoming, "Match not in Upcoming state");
        matches[matchId].state = MatchState.Live;
        emit MatchStarted(matchId);
    }

    /**
     * @notice Transition match from Live to Completed.
     */
    function endMatch(uint256 matchId) external onlyOwner matchExists(matchId) {
        require(matches[matchId].state == MatchState.Live, "Match not in Live state");
        matches[matchId].state = MatchState.Completed;
        emit MatchEnded(matchId);
    }

    /**
     * @notice Slash a reporter — confiscate their stake.
     */
    function slashReporter(address reporter) external onlyOwner nonReentrant {
        require(registeredReporters[reporter], "Not a registered reporter");

        uint256 amount = reporterStakes[reporter];
        registeredReporters[reporter] = false;
        reporterStakes[reporter] = 0;

        emit ReporterSlashed(reporter, amount);
    }

    // ── Public Functions ────────────────────────────────────────────────

    /**
     * @notice Register as a reporter by staking WIRE.
     */
    function registerReporter() external payable nonReentrant {
        require(!registeredReporters[msg.sender], "Already registered");
        require(msg.value >= reporterStake, "Insufficient stake");

        registeredReporters[msg.sender] = true;
        reporterStakes[msg.sender] = msg.value;

        emit ReporterRegistered(msg.sender, msg.value);
    }

    /**
     * @notice Submit a match event hash during a live match.
     * @param matchId The match to submit the event for
     * @param eventHash keccak256 hash of the event data
     */
    function submitEvent(
        uint256 matchId,
        bytes32 eventHash
    ) external onlyReporter matchExists(matchId) {
        require(matches[matchId].state == MatchState.Live, "Match not Live");

        uint256 eventIndex = matches[matchId].eventCount;
        matchEvents[matchId][eventIndex] = eventHash;
        matches[matchId].eventCount++;

        emit EventSubmitted(matchId, msg.sender, eventHash, eventIndex);
    }

    // ── View Functions ──────────────────────────────────────────────────

    /**
     * @notice Get the current state of a match.
     */
    function getMatchState(uint256 matchId) external view returns (MatchState) {
        return matches[matchId].state;
    }

    /**
     * @notice Get full match details.
     */
    function getMatch(uint256 matchId)
        external
        view
        returns (
            string memory team1,
            string memory team2,
            MatchState state,
            uint256 eventCount,
            uint256 createdAt
        )
    {
        Match storage m = matches[matchId];
        return (m.team1, m.team2, m.state, m.eventCount, m.createdAt);
    }
}
