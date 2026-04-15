import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Shield, UserPlus, Users, Lock } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

function TrustBadge({ score }) {
  if (score >= 80) return <Badge variant="green">Trusted ({score})</Badge>;
  if (score >= 50) return <Badge variant="yellow">Moderate ({score})</Badge>;
  return <Badge variant="red">Low ({score})</Badge>;
}

export default function Reporters({ contracts, wallet, addToast }) {
  const [isReporter, setIsReporter] = useState(false);
  const [stake, setStake] = useState('0');
  const [trustScore, setTrustScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [reporters, setReporters] = useState([]);

  const loadStatus = useCallback(async () => {
    if (!contracts?.matchOracle || !wallet) return;
    setLoading(true);
    try {
      const is = await contracts.matchOracle.registeredReporters(wallet);
      const st = await contracts.matchOracle.reporterStakes(wallet);
      const sc = Number(await contracts.matchOracle.getReporterScore(wallet));
      setIsReporter(is);
      setStake(ethers.formatEther(st));
      setTrustScore(sc);

      // Load registered reporters from events
      const filter = contracts.matchOracle.filters.ReporterRegistered();
      const events = await contracts.matchOracle.queryFilter(filter, 0, 'latest');
      const reps = [];
      for (const ev of events) {
        const addr = ev.args[0];
        const score = Number(await contracts.matchOracle.getReporterScore(addr));
        const registered = await contracts.matchOracle.registeredReporters(addr);
        reps.push({ address: addr, score, active: registered, stake: ethers.formatEther(ev.args[1]) });
      }
      setReporters(reps);
    } catch (e) {
      console.error('Error loading reporter info:', e);
    } finally {
      setLoading(false);
    }
  }, [contracts, wallet]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  async function handleRegister() {
    if (!contracts?.matchOracle) return;
    setRegistering(true);
    try {
      addToast?.('info', 'Registering Reporter', 'Confirm in MetaMask (0.01 WIRE)...');
      const tx = await contracts.matchOracle.registerReporter({ value: ethers.parseEther('0.01') });
      await tx.wait();
      addToast?.('success', 'Reporter Registered', 'You are now a staked reporter!', { txHash: tx.hash });
      loadStatus();
    } catch (e) {
      const msg = e.reason || e.message;
      addToast?.('error', 'Registration Failed', msg);
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-up">
      <h2 className="text-2xl font-black text-[#e6f1ff] mb-2">
        <span className="gradient-text">Reporter Registry</span>
      </h2>
      <p className="text-sm text-[#8892b0] mb-8">Staked reporters submit ball-by-ball event data. Earn trust, get rewarded.</p>

      {!wallet && (
        <div className="flex items-center gap-2 text-[#8892b0] text-sm mb-6 p-4 rounded-xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Lock className="w-4 h-4" /> Connect wallet to view reporter status.
        </div>
      )}

      {wallet && (
        <Card className="mb-6">
          <h3 className="font-bold text-[#ccd6f6] flex items-center gap-2 text-sm uppercase tracking-wider mb-4">
            <Shield className="w-4 h-4 text-[#00e676]" /> Your Status
          </h3>
          {isReporter ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.09)' }}>
                <p className="text-2xl font-black gradient-text">Active</p>
                <p className="text-[10px] text-[#8892b0] mt-1 uppercase tracking-wider font-semibold">Status</p>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.09)' }}>
                <p className="text-2xl font-black text-[#ccd6f6]">{stake} WIRE</p>
                <p className="text-[10px] text-[#8892b0] mt-1 uppercase tracking-wider font-semibold">Staked</p>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.09)' }}>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-black text-[#ccd6f6]">{trustScore}</p>
                  <TrustBadge score={trustScore} />
                </div>
                <p className="text-[10px] text-[#8892b0] mt-1 uppercase tracking-wider font-semibold">Trust Score</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#8892b0] mb-4">You are not registered as a reporter. Stake 0.01 WIRE to join.</p>
              <Button onClick={handleRegister} loading={registering} icon={UserPlus} className="text-xs">
                Register as Reporter (0.01 WIRE)
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* All reporters list */}
      <Card>
        <h3 className="font-bold text-[#ccd6f6] flex items-center gap-2 text-sm uppercase tracking-wider mb-4">
          <Users className="w-4 h-4 text-[#00b4d8]" /> Registered Reporters
        </h3>
        {reporters.length === 0 ? (
          <p className="text-sm text-[#8892b0] text-center py-8">No reporters found yet.</p>
        ) : (
          <div className="space-y-2">
            {reporters.map((r) => (
              <div key={r.address} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.09)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `hsl(${parseInt(r.address.slice(2, 6), 16) % 360}, 70%, 60%)`, color: '#000' }}>
                    {r.address.slice(2, 4).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-mono text-[#ccd6f6]">{r.address.slice(0, 6)}...{r.address.slice(-4)}</p>
                    <p className="text-[10px] text-[#8892b0]">Stake: {r.stake} WIRE</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrustBadge score={r.score} />
                  {!r.active && <Badge variant="red">Slashed</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
