'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { useState } from 'react';

interface Props { vaultAddress: `0x${string}` }

export default function Settings({ vaultAddress }: Props) {
  const [newBen, setNewBen] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  const { data: beneficiary, refetch } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'beneficiary' });
  const { data: owner }     = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'owner' });
  const { data: timeout }   = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: factory }   = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'factory' });

  const { writeContractAsync, isPending } = useWriteContract();

  const handleUpdate = async () => {
    if (!newBen) return;
    try {
      setStatus('idle');
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'changeBeneficiary', args: [newBen as `0x${string}`] });
      setStatus('ok');
      setNewBen('');
      setTimeout(refetch, 2500);
    } catch { setStatus('err'); }
  };

  const timeoutDays = timeout ? (Number(timeout) / 86400).toFixed(0) : '—';

  const fields = [
    { label: 'Vault Contract', val: vaultAddress },
    { label: 'Owner', val: (owner as string) || '—' },
    { label: 'Factory', val: (factory as string) || '—' },
    { label: 'Timeout Period', val: `${timeoutDays} days` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)' }}>Settings</h1>

      {/* Vault info */}
      <div className="card">
        <div className="label" style={{ marginBottom: '1rem' }}>Vault Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {fields.map((f) => (
            <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid var(--border)' }}>
              <div className="label" style={{ margin: 0 }}>{f.label}</div>
              <code style={{ fontSize: '0.82rem', color: 'var(--text-2)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{f.val}</code>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className="label" style={{ margin: 0 }}>Current Beneficiary</div>
            <code style={{ fontSize: '0.82rem', color: 'var(--text-1)', fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace' }}>{(beneficiary as string) || '—'}</code>
          </div>
        </div>
      </div>

      {/* Change Beneficiary */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Change Beneficiary</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
          Update the wallet address that can claim this vault after the timeout expires. Only the owner can do this.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">New Beneficiary Address</label>
            <input
              className="input-field"
              placeholder="0x..."
              value={newBen}
              onChange={(e) => setNewBen(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <button className="btn-primary" disabled={!newBen || isPending} onClick={handleUpdate} style={{ flexShrink: 0 }}>
            {isPending ? 'Updating…' : 'Update'}
          </button>
        </div>
        {status === 'ok'  && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Beneficiary updated successfully.</p>}
        {status === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Transaction failed.</p>}
      </div>
    </div>
  );
}
