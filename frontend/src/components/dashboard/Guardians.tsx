'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { useState } from 'react';
import { ShieldCheck, ShieldOff, Plus, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { vaultAddress: `0x${string}` }

export default function Guardians({ vaultAddress }: Props) {
  const [newGuardian, setNewGuardian] = useState('');

  const { data: guardianList, refetch } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'getGuardians' });
  const { data: maxGuardians } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'MAX_GUARDIANS' });
  const { writeContractAsync, isPending } = useWriteContract();

  const list = (guardianList as `0x${string}`[]) || [];
  const max = maxGuardians !== undefined ? Number(maxGuardians) : 5;

  const handleAdd = async () => {
    if (!newGuardian) return;
    const tid = toast.loading('Adding guardian...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'addGuardian', args: [newGuardian.trim() as `0x${string}`] });
      toast.success('Guardian added', { id: tid });
      setNewGuardian('');
      setTimeout(refetch, 2500);
    } catch { toast.error('Failed to add guardian', { id: tid }); }
  };

  const handleRemove = async (addr: `0x${string}`) => {
    const tid = toast.loading('Removing guardian...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'removeGuardian', args: [addr] });
      toast.success('Guardian removed', { id: tid });
      setTimeout(refetch, 2500);
    } catch { toast.error('Failed to remove guardian', { id: tid }); }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Address copied');
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Guardians</h1>

      {/* Info */}
      <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.875rem 1rem' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
          <strong style={{ color: 'var(--accent)' }}>Guardians</strong> are trusted wallets that can ping on your behalf — keeping the vault active when you cannot. They cannot withdraw, pause, or change your beneficiary.
        </p>
      </div>

      {/* Count */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
        <div>
          <div className="label">Active Guardians</div>
          <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', color: 'var(--text-1)' }}>
            {list.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-4)' }}>/ {max}</span>
          </div>
        </div>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: `conic-gradient(var(--accent) ${(list.length / max) * 360}deg, var(--surface-2) 0)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-1)',
          }}>{list.length}/{max}</div>
        </div>
      </div>

      {/* Guardian list */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.5rem' }}>Registered Guardians</div>
        {list.length === 0 ? (
          <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem' }}>
            No guardians registered yet. Add a trusted wallet below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {list.map((addr, i) => (
              <div key={addr} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0',
                borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div className="icon-box icon-box-success" style={{ width: '32px', height: '32px', borderRadius: '6px' }}>
                  <ShieldCheck size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <code style={{ fontSize: '0.82rem', color: 'var(--text-1)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{addr}</code>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', marginTop: '0.1rem' }}>Guardian #{i + 1}</div>
                </div>
                <button onClick={() => copyAddress(addr)} className="btn-ghost" title="Copy address">
                  <Copy size={13} />
                </button>
                <button onClick={() => handleRemove(addr)} disabled={isPending} className="btn-ghost" style={{ color: 'var(--danger)' }} title="Remove guardian">
                  <ShieldOff size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add guardian */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Add Guardian</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
          Share your vault address with the guardian so they can access it from their dashboard.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Guardian Address</label>
            <input className="input-field" placeholder="0x..." value={newGuardian} onChange={(e) => setNewGuardian(e.target.value)} style={{ fontFamily: 'monospace' }} />
          </div>
          <button className="btn-primary" disabled={!newGuardian || isPending || list.length >= max} onClick={handleAdd} style={{ flexShrink: 0, gap: '0.375rem' }}>
            <Plus size={14} /> Add
          </button>
        </div>
        {list.length >= max && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.35rem' }}>Maximum guardians reached.</p>}
      </div>

      {/* Vault address for sharing */}
      <div className="card-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="label" style={{ margin: 0, marginBottom: '0.15rem' }}>Your Vault Address</div>
          <code style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontFamily: 'monospace' }}>{vaultAddress}</code>
        </div>
        <button onClick={() => copyAddress(vaultAddress)} className="btn-ghost"><Copy size={13} /> Copy</button>
      </div>
    </div>
  );
}
