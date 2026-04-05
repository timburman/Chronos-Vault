'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';
import { motion } from 'framer-motion';

interface Props { vaultAddress: `0x${string}` }

function useCountdown(lastPing: bigint | undefined, timeoutPeriod: bigint | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!lastPing || !timeoutPeriod) return { isExpired: false, d: 0, h: 0, m: 0, s: 0, pct: 0 };
  const unlockMs   = (Number(lastPing) + Number(timeoutPeriod)) * 1000;
  const totalMs    = Number(timeoutPeriod) * 1000;
  const remaining  = Math.max(0, unlockMs - now);
  const elapsed    = totalMs - remaining;
  const pct        = Math.min(100, (elapsed / totalMs) * 100);
  const isExpired  = remaining === 0;

  const d = Math.floor(remaining / 86400000);
  const h = Math.floor((remaining % 86400000) / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { isExpired, d, h, m, s, pct };
}

export default function Overview({ vaultAddress }: Props) {
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => { fetchETHPrice().then(setEthPrice); }, []);

  const { data: balance }       = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance' });
  const { data: lastPing, refetch: refetchPing } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'lastPingTime' });
  const { data: timeout }       = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: beneficiary }   = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'beneficiary' });

  const { writeContractAsync: pingFn, isPending: pinging } = useWriteContract();

  const { isExpired, d, h, m, s, pct } = useCountdown(lastPing as bigint, timeout as bigint);

  const ethBal   = balance ? formatEther(balance as bigint) : '0';
  const usdBal   = (parseFloat(ethBal) * ethPrice).toFixed(2);
  const lastDate = lastPing ? new Date(Number(lastPing) * 1000).toLocaleString() : '—';

  const handlePing = async () => {
    try {
      await pingFn({ address: vaultAddress, abi: VaultABI, functionName: 'ping' });
      setTimeout(refetchPing, 2500);
    } catch {}
  };

  const dangerPct = 75; // show warning when >75% elapsed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)' }}>Vault Overview</h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Balance', value: `${parseFloat(ethBal).toFixed(4)} ETH`, sub: `$${usdBal}` },
          { label: 'Timeout Period', value: timeout ? `${Math.round(Number(timeout) / 86400)} days` : '—', sub: 'inactivity threshold' },
          { label: 'Last Ping', value: lastDate, sub: 'proof of life' },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="label">{stat.label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-1)', marginTop: '0.25rem' }}>{stat.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-4)', marginTop: '0.15rem' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Countdown + Ping */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div className="label">Time Until Vault Unlocks</div>
            {isExpired
              ? <span className="pill-danger" style={{ marginTop: '0.5rem' }}>Vault Unlocked</span>
              : pct > dangerPct
                ? <span className="pill-danger" style={{ marginTop: '0.5rem' }}>Ping Required Soon</span>
                : <span className="pill-success" style={{ marginTop: '0.5rem' }}>Active</span>
            }
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-accent"
            disabled={pinging}
            onClick={handlePing}
            style={{ minWidth: '160px', justifyContent: 'center' }}
          >
            {pinging ? 'Broadcasting…' : 'Emit Proof of Life'}
          </motion.button>
        </div>

        {/* Digits */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem' }}>
          {[[d, 'Days'], [h, 'Hours'], [m, 'Minutes'], [s, 'Seconds']].map(([val, unit]) => (
            <div key={String(unit)} style={{ textAlign: 'center' }}>
              <div className="countdown-digit">{String(val).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{unit}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ background: 'var(--surface-2)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '4px',
            background: pct > dangerPct ? 'var(--danger)' : 'var(--success)',
            transition: 'width 1s linear',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>Last ping</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{pct.toFixed(1)}% elapsed</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>Unlock</span>
        </div>
      </div>

      {/* Beneficiary */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.5rem' }}>Designated Beneficiary</div>
        <code style={{ fontSize: '0.88rem', color: 'var(--text-2)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
          {(beneficiary as string) || '—'}
        </code>
      </div>
    </div>
  );
}
