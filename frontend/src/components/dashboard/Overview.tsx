'use client';

import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { formatEther } from 'viem';
import { useState, useEffect, useCallback } from 'react';
import { fetchETHPrice } from '@/utils/price';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Pause, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { vaultAddress: `0x${string}` }

function useCountdown(lastPing: bigint | undefined, timeoutPeriod: bigint | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!lastPing || !timeoutPeriod) return { isExpired: false, d: 0, h: 0, m: 0, s: 0, pct: 0 };
  const unlockMs = (Number(lastPing) + Number(timeoutPeriod)) * 1000;
  const totalMs = Number(timeoutPeriod) * 1000;
  const remaining = Math.max(0, unlockMs - now);
  const elapsed = totalMs - remaining;
  const pct = Math.min(100, (elapsed / totalMs) * 100);
  const d = Math.floor(remaining / 86400000);
  const h = Math.floor((remaining % 86400000) / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { isExpired: remaining === 0, d, h, m, s, pct };
}

export default function Overview({ vaultAddress }: Props) {
  const [ethPrice, setEthPrice] = useState(0);
  useEffect(() => { fetchETHPrice().then(setEthPrice); }, []);

  const { data: balance, refetch: refetchBalance } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance' });
  const { data: lastPing, refetch: refetchPing } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'lastPingTime' });
  const { data: timeout } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: beneficiary } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'beneficiary' });
  const { data: isPaused } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'paused' });
  const { data: guardianCt } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'guardianCount' });

  const { writeContractAsync, isPending: pinging } = useWriteContract();
  const { isExpired, d, h, m, s, pct } = useCountdown(lastPing as bigint, timeout as bigint);

  const refetchAll = useCallback(() => { refetchPing(); refetchBalance(); }, [refetchPing, refetchBalance]);
  useWatchContractEvent({ address: vaultAddress, abi: VaultABI, eventName: 'Pinged', onLogs: () => refetchAll() });
  useWatchContractEvent({ address: vaultAddress, abi: VaultABI, eventName: 'Funded', onLogs: () => refetchBalance() });

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const usdBal = (parseFloat(ethBal) * ethPrice).toFixed(2);
  const lastDate = lastPing ? new Date(Number(lastPing) * 1000).toLocaleString() : '—';

  const handlePing = async () => {
    const tid = toast.loading('Broadcasting proof of life...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'ping' });
      toast.success('Ping confirmed — timer reset', { id: tid });
    } catch { toast.error('Ping failed', { id: tid }); }
  };

  // Health
  const healthColor = isPaused ? 'var(--text-4)' : isExpired ? 'var(--danger)' : pct > 75 ? 'var(--danger)' : pct > 50 ? 'var(--accent)' : 'var(--success)';
  const healthLabel = isPaused ? 'Paused' : isExpired ? 'Critical' : pct > 75 ? 'Warning' : pct > 50 ? 'Moderate' : 'Healthy';
  const healthBg = isPaused ? 'var(--surface-2)' : isExpired ? 'var(--danger-bg)' : pct > 75 ? 'var(--danger-bg)' : pct > 50 ? 'var(--accent-bg)' : 'var(--success-bg)';
  const HealthIcon = isPaused ? Pause : isExpired ? AlertTriangle : pct > 75 ? AlertTriangle : Shield;

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Overview</h1>

      {/* Health */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
        <div className="icon-box" style={{ background: healthBg, color: healthColor, width: '40px', height: '40px' }}>
          <HealthIcon size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="label" style={{ marginBottom: '0.1rem' }}>Vault Health</div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: healthColor }}>{healthLabel}</span>
          {isPaused && <span className="pill-accent" style={{ fontSize: '0.65rem', marginLeft: '0.5rem' }}>Deposits & Claims Paused</span>}
        </div>
        <div style={{ width: '72px', height: '5px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.max(100 - pct, 0)}%`, borderRadius: '3px', background: healthColor, transition: 'width 1s linear' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'Balance', value: `${parseFloat(ethBal).toFixed(4)} ETH`, sub: `$${usdBal}` },
          { label: 'Timeout', value: timeout ? `${Math.round(Number(timeout) / 86400)}d` : '—', sub: 'inactivity window' },
          { label: 'Last Ping', value: lastDate, sub: 'proof of life' },
          { label: 'Guardians', value: guardianCt !== undefined ? String(Number(guardianCt)) : '0', sub: 'trusted pingers' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '1rem' }}>
            <div className="label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Countdown + Ping */}
      <div className="card" style={{ padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="label">Time Until Unlock</div>
            {isExpired ? <span className="pill-danger" style={{ marginTop: '0.375rem' }}>Vault Unlocked</span>
              : pct > 75 ? <span className="pill-danger" style={{ marginTop: '0.375rem' }}>Ping Required Soon</span>
              : <span className="pill-success" style={{ marginTop: '0.375rem' }}>Active</span>}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-accent" disabled={pinging} onClick={handlePing} style={{ minWidth: '140px', justifyContent: 'center' }}>
            <Activity size={14} />
            {pinging ? 'Broadcasting...' : 'Proof of Life'}
          </motion.button>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
          {[[d, 'Days'], [h, 'Hrs'], [m, 'Min'], [s, 'Sec']].map(([val, unit]) => (
            <div key={String(unit)} style={{ textAlign: 'center' }}>
              <div className="countdown-digit">{String(val).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{unit}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--surface-2)', borderRadius: '3px', height: '5px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: '3px', background: pct > 75 ? 'var(--danger)' : 'var(--success)', transition: 'width 1s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>Last ping</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>{pct.toFixed(1)}%</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>Unlock</span>
        </div>
      </div>

      {/* Beneficiary */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="label" style={{ marginBottom: '0.35rem' }}>Designated Beneficiary</div>
        <code style={{ fontSize: '0.82rem', color: 'var(--text-2)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{(beneficiary as string) || '—'}</code>
      </div>
    </div>
  );
}
