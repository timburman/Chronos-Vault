'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props { vaultAddress: `0x${string}` }

export default function Claim({ vaultAddress }: Props) {
  const [ethPrice, setEthPrice] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchETHPrice().then(setEthPrice);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: balance, refetch } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance' });
  const { data: lastPing } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'lastPingTime' });
  const { data: timeout } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: owner } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'owner' });
  const { writeContractAsync, isPending } = useWriteContract();

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const usdBal = (parseFloat(ethBal) * ethPrice).toFixed(2);

  let isUnlocked = false, d = 0, h = 0, m = 0, s = 0;
  if (lastPing && timeout) {
    const remaining = Math.max(0, (Number(lastPing) + Number(timeout)) * 1000 - now);
    isUnlocked = remaining === 0;
    d = Math.floor(remaining / 86400000);
    h = Math.floor((remaining % 86400000) / 3600000);
    m = Math.floor((remaining % 3600000) / 60000);
    s = Math.floor((remaining % 60000) / 1000);
  }

  const handleClaimETH = async () => {
    const tid = toast.loading('Claiming inheritance...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'claimFunds' });
      toast.success('Inheritance claimed successfully', { id: tid });
      setTimeout(refetch, 2500);
    } catch { toast.error('Claim failed', { id: tid }); }
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Claim Inheritance</h1>

      {/* Manifest */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.5rem' }}>Inheritance Details</div>
        <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '0.15rem' }}>ETH Balance</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--text-1)' }}>{parseFloat(ethBal).toFixed(4)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>${usdBal}</div>
        </div>
      </div>

      <div className="card-sm">
        <div className="label" style={{ margin: 0, marginBottom: '0.15rem' }}>Vault Owner</div>
        <code style={{ fontSize: '0.78rem', color: 'var(--text-2)', wordBreak: 'break-all' }}>{(owner as string) || '—'}</code>
      </div>

      {/* Status */}
      <div className="card">
        {isUnlocked ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="label">Status</div>
            <span className="pill-success" style={{ marginTop: '0.25rem', marginBottom: '1rem', display: 'inline-flex' }}>Vault Unlocked</span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '1rem' }}>
              The inactivity timeout has elapsed. You are authorized to claim the inheritance.
            </p>
            <button className="btn-accent" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} disabled={isPending || parseFloat(ethBal) === 0} onClick={handleClaimETH}>
              {isPending ? 'Processing...' : 'Claim ETH Inheritance'}
            </button>
          </motion.div>
        ) : (
          <div>
            <div className="label">Status</div>
            <span className="pill-danger" style={{ marginTop: '0.25rem', marginBottom: '1rem', display: 'inline-flex' }}>Vault Locked</span>
            <div className="label" style={{ marginBottom: '0.5rem' }}>Time remaining</div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem' }}>
              {[[d, 'Days'], [h, 'Hrs'], [m, 'Min'], [s, 'Sec']].map(([val, unit]) => (
                <div key={String(unit)} style={{ textAlign: 'center' }}>
                  <div className="countdown-digit">{String(val).padStart(2, '0')}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{unit}</div>
                </div>
              ))}
            </div>
            <button className="btn-secondary" disabled style={{ width: '100%', justifyContent: 'center', opacity: 0.4, cursor: 'not-allowed' }}>Claim — Locked</button>
          </div>
        )}
      </div>
    </div>
  );
}
