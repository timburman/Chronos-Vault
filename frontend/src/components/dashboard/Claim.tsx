'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';
import { motion } from 'framer-motion';

interface Props { vaultAddress: `0x${string}` }

export default function Claim({ vaultAddress }: Props) {
  const [ethPrice, setEthPrice] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchETHPrice().then(setEthPrice);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: balance, refetch }  = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance' });
  const { data: lastPing }          = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'lastPingTime' });
  const { data: timeout }           = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: owner }             = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'owner' });
  const { writeContractAsync, isPending } = useWriteContract();

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const usdBal = (parseFloat(ethBal) * ethPrice).toFixed(2);

  let isUnlocked = false;
  let d = 0, h = 0, m = 0, s = 0;
  if (lastPing && timeout) {
    const unlockMs  = (Number(lastPing) + Number(timeout)) * 1000;
    const remaining = Math.max(0, unlockMs - now);
    isUnlocked = remaining === 0;
    d = Math.floor(remaining / 86400000);
    h = Math.floor((remaining % 86400000) / 3600000);
    m = Math.floor((remaining % 3600000) / 60000);
    s = Math.floor((remaining % 60000) / 1000);
  }

  const handleClaim = async () => {
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'claimFunds' });
      setTimeout(refetch, 2500);
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)' }}>Claim Inheritance</h1>

      {/* Balance */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.5rem' }}>Claimable Assets</div>
        <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '2.2rem', color: 'var(--text-1)' }}>
          {parseFloat(ethBal).toFixed(6)} ETH
        </div>
        <div style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginTop: '0.25rem' }}>${usdBal} USD</div>
      </div>

      {/* Vault owner */}
      <div className="card-sm">
        <div className="label" style={{ margin: 0, marginBottom: '0.25rem' }}>Vault Owner</div>
        <code style={{ fontSize: '0.82rem', color: 'var(--text-2)', wordBreak: 'break-all' }}>{(owner as string) || '—'}</code>
      </div>

      {/* Status + Countdown */}
      <div className="card">
        {isUnlocked ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div className="label">Status</div>
                <span className="pill-success" style={{ marginTop: '0.5rem' }}>Vault Unlocked</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              The inactivity timeout has elapsed without a ping from the vault owner. You are now authorized to sweep the assets to your wallet.
            </p>
            <button
              className="btn-accent"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.875rem' }}
              disabled={isPending || parseFloat(ethBal) === 0}
              onClick={handleClaim}
            >
              {isPending ? 'Processing…' : 'Claim Inheritance'}
            </button>
          </motion.div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div className="label">Status</div>
                <span className="pill-danger" style={{ marginTop: '0.5rem' }}>Vault Locked</span>
              </div>
            </div>
            <div className="label" style={{ marginBottom: '0.75rem' }}>Time remaining</div>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              {[[d, 'Days'], [h, 'Hours'], [m, 'Min'], [s, 'Sec']].map(([val, unit]) => (
                <div key={String(unit)} style={{ textAlign: 'center' }}>
                  <div className="countdown-digit">{String(val).padStart(2, '0')}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{unit}</div>
                </div>
              ))}
            </div>
            <button className="btn-secondary" disabled style={{ width: '100%', justifyContent: 'center', opacity: 0.45, cursor: 'not-allowed' }}>
              Claim Inheritance — Locked
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
