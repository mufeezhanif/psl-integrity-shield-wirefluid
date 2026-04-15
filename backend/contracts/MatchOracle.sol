// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MatchOracle
 * @notice Immutable event ledger for PSL matches.
 * Staked reporters submit ball-by-ball event hashes during live matches.
 */
contract MatchOracle is Ownable, ReentrancyGuard, Pausable {

    enum MatchState { Upcoming, Live, Completed }

    struct Match {
        string team1;
        string team2;
        MatchState state;
        uint256 eventCount;
        uint256 createdAt;
    }

    uint256 public reporterStake = 0.01 ether;
    uint256 public matchCount;

    mapping(uint256 => Match) public matches;
    mapping(address => bool) public registeredReporters;
    mapping(address => uint256) public reporterStakes;
    mapping(uint256 => mapping(uint256 => bytes32)) public matchEvents;
    mapping(address => uint256) public reporterScores; // Feature 5

    event MatchCreated(uint256 indexed matchId, string team1, string team2);
    event ReporterRegistered(address indexed reporter, uint256 stake);
    event EventSubmitted(uint256 indexed matchId, address indexed reporter, bytes32 eventHash, uint256 eventIndex);
    event MatchStarted(uint256 indexed matchId);
    event MatchEnded(uint256 indexed matchId);
    event ReporterSlashed(address indexed reporter, uint256 amount);
    event ReporterScoreUpdated(address indexed reporter, uint256 newScore);
    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyReporter() {
        require(registeredReporters[msg.sender], "Not a registered reporter");
        _;
    }

    modifier matchExists(uint256 matchId) {
        require(matches[matchId].createdAt != 0, "Match does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createMatch(uint256 matchId, string calldata team1, string calldata team2) external onlyOwner whenNotPaused {
        require(matches[matchId].createdAt == 0, "Match already exists");
        require(bytes(team1).length > 0 && bytes(team2).length > 0, "Empty team name");
        matches[matchId] = Match({ team1: team1, team2: team2, state: MatchState.Upcoming, eventCount: 0, createdAt: block.timestamp });
        matchCount++;
        emit MatchCreated(matchId, team1, team2);
    }

    function startMatch(uint256 matchId) external onlyOwner matchExists(matchId) whenNotPaused {
        require(matches[matchId].state == MatchState.Upcoming, "Match not in Upcoming state");
        matches[matchId].state = MatchState.Live;
        emit MatchStarted(matchId);
    }

    function endMatch(uint256 matchId) external onlyOwner matchExists(matchId) whenNotPaused {
        require(matches[matchId].state == MatchState.Live, "Match not in Live state");
        matches[matchId].state = MatchState.Completed;
        emit MatchEnded(matchId);
    }

    function slashReporter(address reporter) external onlyOwner nonReentrant {
        require(registeredReporters[reporter], "Not a registered reporter");
        uint256 amount = reporterStakes[reporter];
        registeredReporters[reporter] = false;
        reporterStakes[reporter] = 0;
        _updateReporterScore(reporter, -50);
        emit ReporterSlashed(reporter, amount);
    }

    function registerReporter() external payable nonReentrant whenNotPaused {
        require(!registeredReporters[msg.sender], "Already registered");
        require(msg.value >= reporterStake, "Insufficient stake");
        registeredReporters[msg.sender] = true;
        reporterStakes[msg.sender] = msg.value;
        reporterScores[msg.sender] = 100;
        emit ReporterRegistered(msg.sender, msg.value);
        emit ReporterScoreUpdated(msg.sender, 100);
    }

    function submitEvent(uint256 matchId, bytes32 eventHash) external onlyReporter matchExists(matchId) whenNotPaused {
        require(matches[matchId].state == MatchState.Live, "Match not Live");
        uint256 eventIndex = matches[matchId].eventCount;
        matchEvents[matchId][eventIndex] = eventHash;
        matches[matchId].eventCount++;
        _updateReporterScore(msg.sender, 1);
        emit EventSubmitted(matchId, msg.sender, eventHash, eventIndex);
    }

    function getMatchState(uint256 matchId) external view returns (MatchState) { return matches[matchId].state; }

    function getMatch(uint256 matchId) external view returns (string memory team1, string memory team2, MatchState state, uint256 eventCount, uint256 createdAt) {
        Match storage m = matches[matchId];
        return (m.team1, m.team2, m.state, m.eventCount, m.createdAt);
    }

    function getReporterScore(address reporter) external view returns (uint256) { return reporterScores[reporter]; }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function withdrawSlashedFunds() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "No funds");
        (bool sent, ) = payable(owner()).call{value: bal}("");
        require(sent, "Withdraw failed");
        emit FundsWithdrawn(owner(), bal);
    }

    function _updateReporterScore(address reporter, int256 delta) internal {
        int256 current = int256(reporterScores[reporter]);
        int256 newScore = current + delta;
        if (newScore < 0) newScore = 0;
        if (newScore > 200) newScore = 200;
        reporterScores[reporter] = uint256(newScore);
        emit ReporterScoreUpdated(reporter, uint256(newScore));
    }
}
