import { ethers } from 'ethers';

export const ADDRESSES = {
  MatchOracle: '0x7b457E75Ad7AB2331FCDdeC5f0a80d33a6e34771',
  PredictionEngine: '0xa97094e559e2570A37045542fed7A1Ff03763E87',
  AnomalyTracker: '0x1570200C79D6245ba77797541e4fab90bCfDAC34',
};

export const ABI_MO = [
  'function createMatch(uint256,string,string)',
  'function startMatch(uint256)',
  'function endMatch(uint256)',
  'function registerReporter() payable',
  'function submitEvent(uint256,bytes32)',
  'function getMatch(uint256) view returns (string,string,uint8,uint256,uint256)',
  'function getMatchState(uint256) view returns (uint8)',
  'function matchCount() view returns (uint256)',
  'function registeredReporters(address) view returns (bool)',
  'function reporterStakes(address) view returns (uint256)',
  'function getReporterScore(address) view returns (uint256)',
  'event EventSubmitted(uint256 indexed,address indexed,bytes32,uint256)',
  'event ReporterRegistered(address indexed,uint256)',
];

export const ABI_PE = [
  'function commitPrediction(uint256,bytes32)',
  'function revealPrediction(uint256,string,uint256,bytes32)',
  'function checkDivergence(uint256,string)',
  'function getAggregatedResults(uint256) view returns (uint256,uint256,uint256)',
  'function getWinnerVotes(uint256,string) view returns (uint256)',
  'function getDivergenceScore(uint256) view returns (uint256)',
  'function divergenceChecked(uint256) view returns (bool)',
  'event PredictionRevealed(uint256 indexed,address indexed,string,uint256)',
  'event HighDivergenceDetected(uint256 indexed,uint256)',
];

export const ABI_AT = [
  'function raiseFlag(uint256,string) payable',
  'function voteOnFlag(uint256,bool) payable',
  'function resolveFlag(uint256)',
  'function certifyMatch(uint256)',
  'function getIntegrityScore(uint256) view returns (uint256)',
  'function isMatchCertified(uint256) view returns (bool)',
  'function getFlag(uint256) view returns (uint256,address,string,uint256,uint256,uint256,uint256,bool,bool)',
  'function flagCount() view returns (uint256)',
  'event FlagRaised(uint256 indexed,uint256 indexed,address indexed,string,uint256)',
  'event CleanMatchCertified(uint256 indexed,uint256)',
];

export function getContracts(signer) {
  return {
    matchOracle: new ethers.Contract(ADDRESSES.MatchOracle, ABI_MO, signer),
    predictionEngine: new ethers.Contract(ADDRESSES.PredictionEngine, ABI_PE, signer),
    anomalyTracker: new ethers.Contract(ADDRESSES.AnomalyTracker, ABI_AT, signer),
  };
}

export function getReadOnlyContracts() {
  const provider = new ethers.JsonRpcProvider('https://evm.wirefluid.com');
  return {
    matchOracle: new ethers.Contract(ADDRESSES.MatchOracle, ABI_MO, provider),
    predictionEngine: new ethers.Contract(ADDRESSES.PredictionEngine, ABI_PE, provider),
    anomalyTracker: new ethers.Contract(ADDRESSES.AnomalyTracker, ABI_AT, provider),
  };
}
