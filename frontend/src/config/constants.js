export const NETWORK = {
  chainId: '0x169B5', // 92533
  name: 'WireFluid Testnet',
  currency: 'WIRE',
  rpc: 'https://evm.wirefluid.com',
  explorer: 'https://scan.wirefluid.com',
};

/** Real-ish PSL team accent colors for dark UI */
export const TEAM_COLORS = {
  'Karachi Kings':      '#38bdf8', // sky blue
  'Lahore Qalandars':   '#4ade80', // bright green
  'Islamabad United':   '#f87171', // coral red
  'Peshawar Zalmi':     '#fbbf24', // amber
  'Multan Sultans':     '#c084fc', // violet
  'Quetta Gladiators':  '#60a5fa', // blue
};

export function teamColor(name) {
  return TEAM_COLORS[name] ?? '#00e676';
}

/** GenZ integrity labels */
export function vibeLabel(score) {
  if (score >= 90) return { text: 'Certified W 🏆', variant: 'green' };
  if (score >= 75) return { text: 'Looking Based 🤙', variant: 'green' };
  if (score >= 50) return { text: 'Kinda Sus 👀', variant: 'yellow' };
  if (score >= 25) return { text: 'Major Red Flag 🚩', variant: 'red' };
  return { text: 'Straight Cap 💀', variant: 'red' };
}

export const INITIAL_MATCHES = [
  {
    id: 1,
    team1: 'Karachi Kings',
    team2: 'Lahore Qalandars',
    status: 'Live',
    score: 94,
    events: 12,
    time: 'In Progress',
    flagCount: 2,
  },
  {
    id: 2,
    team1: 'Islamabad United',
    team2: 'Peshawar Zalmi',
    status: 'Upcoming',
    score: 100,
    events: 0,
    time: 'Tomorrow, 7:00 PM',
    flagCount: 0,
  },
  {
    id: 3,
    team1: 'Multan Sultans',
    team2: 'Quetta Gladiators',
    status: 'Completed',
    score: 61,
    events: 45,
    time: 'Yesterday, 7:00 PM',
    flagCount: 5,
  },
  {
    id: 4,
    team1: 'Karachi Kings',
    team2: 'Multan Sultans',
    status: 'Completed',
    score: 34,
    events: 67,
    time: '2 Days Ago',
    flagCount: 11,
  },
];

export const INITIAL_FLAGS = [
  {
    id: 1,
    matchId: 1,
    description: 'Unusual batting collapse in the 15th over — three top-order wickets in two balls with no run pressure.',
    stakeWire: '0.05',
    upvotes: 4,
    downvotes: 1,
    reporter: '0xAbC...1234',
    status: 'Open',
  },
  {
    id: 2,
    matchId: 3,
    description: 'Suspicious no-ball sequence at death overs — bowler foot consistently behind crease despite umpire checks.',
    stakeWire: '0.05',
    upvotes: 9,
    downvotes: 2,
    reporter: '0xDeF...5678',
    status: 'Resolved',
  },
];
