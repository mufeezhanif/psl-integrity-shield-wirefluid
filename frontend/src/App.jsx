import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import Header from './components/layout/Header.jsx';
import Dashboard from './views/Dashboard.jsx';
import MatchDetail from './components/match/MatchDetail.jsx';
import Predictions from './views/Predictions.jsx';
import Reporters from './views/Reporters.jsx';
import AuditTrail from './views/AuditTrail.jsx';
import Leaderboard from './views/Leaderboard.jsx';
import SeasonDashboard from './views/SeasonDashboard.jsx';
import ToastContainer from './components/ui/Toast.jsx';
import useWallet from './hooks/useWallet.js';
import useChainData from './hooks/useChainData.js';

let toastId = 0;

function parseTxError(e) {
  if (e.reason) return e.reason;
  if (e.data?.message) return e.data.message;
  if (e.message?.includes('user rejected')) return 'Transaction rejected by user';
  if (e.message?.includes('insufficient funds')) return 'Insufficient WIRE balance';
  if (e.code === 'ACTION_REJECTED') return 'Transaction rejected by user';
  return e.message || 'Transaction failed';
}

export default function App() {
  const { wallet, copied, connect, copyAddress, contracts } = useWallet();
  const { matches, flags, loading, seasonStats, refresh } = useChainData(contracts);

  const [view, setView] = useState('dashboard');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, extra = {}) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message, ...extra }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleSelectMatch = useCallback((match) => {
    setSelectedMatch(match);
    setView('match');
  }, []);

  const handleBack = useCallback(() => {
    setView('dashboard');
    setSelectedMatch(null);
  }, []);

  const navigate = useCallback((v) => {
    setView(v);
    setSelectedMatch(null);
  }, []);

  const handleRaiseFlag = useCallback(async ({ matchId, description, stakeWire }) => {
    if (!contracts?.anomalyTracker) return;
    try {
      addToast('info', 'Submitting Flag', 'Confirm the transaction in MetaMask...');
      const tx = await contracts.anomalyTracker.raiseFlag(matchId, description, { value: ethers.parseEther(stakeWire) });
      addToast('info', 'Transaction Sent', 'Waiting for confirmation...', { txHash: tx.hash });
      await tx.wait();
      addToast('success', 'Flag Raised', `Flag submitted for Match #${matchId}`, { txHash: tx.hash });
      refresh();
    } catch (e) {
      addToast('error', 'Flag Failed', parseTxError(e));
    }
  }, [contracts, refresh, addToast]);

  const handleVote = useCallback(async (flagId, direction) => {
    if (!contracts?.anomalyTracker) return;
    try {
      const support = direction === 'up';
      addToast('info', 'Submitting Vote', 'Confirm the transaction in MetaMask...');
      const tx = await contracts.anomalyTracker.voteOnFlag(flagId, support, { value: ethers.parseEther('0.005') });
      addToast('info', 'Transaction Sent', 'Waiting for confirmation...', { txHash: tx.hash });
      await tx.wait();
      addToast('success', 'Vote Cast', `Vote ${support ? 'for' : 'against'} flag #${flagId} confirmed`, { txHash: tx.hash });
      refresh();
    } catch (e) {
      addToast('error', 'Vote Failed', parseTxError(e));
    }
  }, [contracts, refresh, addToast]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        wallet={wallet}
        onConnect={connect}
        onNavigate={navigate}
        activeView={view}
        copied={copied}
        onCopy={copyAddress}
      />

      {loading && matches.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#00e676] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#8892b0]">Loading on-chain data...</p>
          </div>
        </div>
      )}

      {view === 'dashboard' && (
        <Dashboard matches={matches} flags={flags} seasonStats={seasonStats} onSelectMatch={handleSelectMatch} onRefresh={refresh} />
      )}
      {view === 'match' && selectedMatch && (
        <MatchDetail match={selectedMatch} flags={flags} wallet={wallet} onBack={handleBack} onRaiseFlag={handleRaiseFlag} onVote={handleVote} />
      )}
      {view === 'predictions' && (
        <Predictions contracts={contracts} wallet={wallet} matches={matches} addToast={addToast} />
      )}
      {view === 'reporters' && (
        <Reporters contracts={contracts} wallet={wallet} addToast={addToast} matches={matches} />
      )}
      {view === 'audit' && (
        <AuditTrail contracts={contracts} matches={matches} />
      )}
      {view === 'leaderboard' && (
        <Leaderboard contracts={contracts} matches={matches} />
      )}
      {view === 'season' && (
        <SeasonDashboard matches={matches} flags={flags} seasonStats={seasonStats} />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
