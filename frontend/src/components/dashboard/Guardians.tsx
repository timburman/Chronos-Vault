'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { useState } from 'react';

interface Props { vaultAddress: `0x${string}` }

export default function Guardians({ vaultAddress }: Props) {
  const [newGuardian, setNewGuardian] = useState('');
  const [removeAddr, setRemoveAddr] = useState('');
  const [checkAddr, setCheckAddr] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'err' | 'removed'>('idle');

  const { data: guardianCount, refetch } = useReadContract({
    address: vaultAddress, abi: VaultABI, functionName: 'guardianCount',
  });
  const { data: maxGuardians } = useReadContract({
    address: vaultAddress, abi: VaultABI, functionName: 'MAX_GUARDIANS',
  });

  // Check if a specific address is a guardian
  const { data: isGuardian } = useReadContract({
    address: vaultAddress, abi: VaultABI, functionName: 'guardians',
    args: checkAddr.length === 42 ? [checkAddr as `0x${string}`] : undefined,
    query: { enabled: checkAddr.length === 42 },
  });

  const { writeContractAsync, isPending } = useWriteContract();

  const handleAdd = async () => {
    if (!newGuardian) return;
    try {
      setStatus('idle');
      await writeContractAsync({
        address: vaultAddress, abi: VaultABI,
        functionName: 'addGuardian', args: [newGuardian.trim() as `0x${string}`],
      });
      setStatus('ok');
      setNewGuardian('');
      setTimeout(refetch, 2500);
    } catch { setStatus('err'); }
  };

  const handleRemove = async () => {
    if (!removeAddr) return;
    try {
      setStatus('idle');
      await writeContractAsync({
        address: vaultAddress, abi: VaultABI,
        functionName: 'removeGuardian', args: [removeAddr.trim() as `0x${string}`],
      });
      setStatus('removed');
      setRemoveAddr('');
      setTimeout(refetch, 2500);
    } catch { setStatus('err'); }
  };

  const count = guardianCount !== undefined ? Number(guardianCount) : 0;
  const max = maxGuardians !== undefined ? Number(maxGuardians) : 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)' }}>Guardians</h1>

      {/* Info card */}
      <div style={{
        background: 'var(--accent-bg)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '1rem 1.25rem',
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--accent)' }}>What are guardians?</strong> — Trusted wallets that can ping on your behalf. They <em>cannot</em> withdraw, pause, or change your beneficiary. Useful for: a spouse's phone wallet, a hardware key in a safe, or an automated keeper bot.
        </div>
      </div>

      {/* Guardian count */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label">Active Guardians</div>
            <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '2rem', color: 'var(--text-1)' }}>
              {count} <span style={{ fontSize: '1rem', color: 'var(--text-4)' }}>/ {max}</span>
            </div>
          </div>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: `conic-gradient(var(--accent) ${(count / max) * 360}deg, var(--surface-2) 0)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%',
              background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)',
            }}>
              {count}/{max}
            </div>
          </div>
        </div>
      </div>

      {/* Check guardian */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Check Guardian Status</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1rem', lineHeight: 1.65 }}>
          Enter an address to check if it's currently registered as a guardian.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <input
              className="input-field"
              placeholder="0x…"
              value={checkAddr}
              onChange={(e) => setCheckAddr(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>
        {checkAddr.length === 42 && isGuardian !== undefined && (
          <div style={{
            marginTop: '0.5rem', fontSize: '0.82rem',
            color: isGuardian ? 'var(--success)' : 'var(--text-4)',
          }}>
            {isGuardian ? '✓ This address is a guardian' : '✗ Not a guardian'}
          </div>
        )}
      </div>

      {/* Add guardian */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Add Guardian</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1rem', lineHeight: 1.65 }}>
          Register a new wallet address as a trusted guardian. They will be able to ping on your behalf.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Guardian Address</label>
            <input
              className="input-field"
              placeholder="0x…"
              value={newGuardian}
              onChange={(e) => setNewGuardian(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <button
            className="btn-primary"
            disabled={!newGuardian || isPending || count >= max}
            onClick={handleAdd}
            style={{ flexShrink: 0 }}
          >
            {isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
        {count >= max && (
          <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Maximum guardians reached. Remove one to add another.</p>
        )}
      </div>

      {/* Remove guardian */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Remove Guardian</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1rem', lineHeight: 1.65 }}>
          Remove a previously registered guardian.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Guardian Address</label>
            <input
              className="input-field"
              placeholder="0x…"
              value={removeAddr}
              onChange={(e) => setRemoveAddr(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <button
            className="btn-secondary"
            disabled={!removeAddr || isPending}
            onClick={handleRemove}
            style={{ flexShrink: 0 }}
          >
            {isPending ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>

      {/* Status messages */}
      {status === 'ok'      && <p style={{ color: 'var(--success)', fontSize: '0.82rem' }}>Guardian added successfully.</p>}
      {status === 'removed' && <p style={{ color: 'var(--success)', fontSize: '0.82rem' }}>Guardian removed successfully.</p>}
      {status === 'err'     && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>Transaction failed.</p>}
    </div>
  );
}
