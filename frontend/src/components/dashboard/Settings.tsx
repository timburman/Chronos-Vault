'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Props { vaultAddress: `0x${string}` }

export default function Settings({ vaultAddress }: Props) {
  const [newBen, setNewBen] = useState('');
  const [newTimeout, setNewTimeout] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const { data: beneficiary, refetch: refetchBen } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'beneficiary' });
  const { data: owner } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'owner' });
  const { data: timeout } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: factory } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'factory' });
  const { data: isPaused, refetch: refetchPause } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'paused' });
  const { data: pendingBen, refetch: refetchPending } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'pendingBeneficiary' });
  const { data: unlockTime } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'beneficiaryChangeUnlockTime' });

  const { writeContractAsync, isPending } = useWriteContract();

  const timeoutDays = timeout ? (Number(timeout) / 86400).toFixed(0) : '—';
  const hasPending = pendingBen && pendingBen !== '0x0000000000000000000000000000000000000000';
  const unlockMs = unlockTime ? Number(unlockTime) * 1000 : 0;
  const canExecute = hasPending && now >= unlockMs;
  const timelockRemaining = hasPending && unlockMs > now ? Math.ceil((unlockMs - now) / 3600000) : 0;

  const handlePropose = async () => {
    if (!newBen) return;
    const tid = toast.loading('Proposing beneficiary change...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'proposeBeneficiaryChange', args: [newBen.trim() as `0x${string}`] });
      toast.success('Change proposed — 3-day timelock started', { id: tid });
      setNewBen(''); setTimeout(refetchPending, 2500);
    } catch { toast.error('Proposal failed', { id: tid }); }
  };

  const handleExecute = async () => {
    const tid = toast.loading('Executing beneficiary change...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'executeBeneficiaryChange' });
      toast.success('Beneficiary updated', { id: tid });
      setTimeout(() => { refetchBen(); refetchPending(); }, 2500);
    } catch { toast.error('Execution failed', { id: tid }); }
  };

  const handleCancel = async () => {
    const tid = toast.loading('Cancelling...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'cancelBeneficiaryChange' });
      toast.success('Pending change cancelled', { id: tid });
      setTimeout(refetchPending, 2500);
    } catch { toast.error('Cancel failed', { id: tid }); }
  };

  const handlePauseToggle = async () => {
    const tid = toast.loading(isPaused ? 'Unpausing...' : 'Pausing...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: isPaused ? 'unpause' : 'pause' });
      toast.success(isPaused ? 'Vault unpaused' : 'Vault paused', { id: tid });
      setTimeout(refetchPause, 2500);
    } catch { toast.error('Action failed', { id: tid }); }
  };

  const handleTimeoutChange = async () => {
    if (!newTimeout) return;
    const tid = toast.loading('Updating timeout...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'changeTimeoutPeriod', args: [BigInt(parseInt(newTimeout) * 86400)] });
      toast.success(`Timeout updated to ${newTimeout} days`, { id: tid });
      setNewTimeout('');
    } catch { toast.error('Failed — minimum is 7 days', { id: tid }); }
  };

  const fields = [
    { label: 'Vault', val: vaultAddress },
    { label: 'Owner', val: (owner as string) || '—' },
    { label: 'Factory', val: (factory as string) || '—' },
    { label: 'Timeout', val: `${timeoutDays} days` },
  ];

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Settings</h1>

      {/* Vault info */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.75rem' }}>Vault Information</div>
        {fields.map((f) => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', paddingBottom: '0.625rem', borderBottom: '1px solid var(--border)', marginBottom: '0.625rem' }}>
            <div className="label" style={{ margin: 0 }}>{f.label}</div>
            <code style={{ fontSize: '0.78rem', color: 'var(--text-2)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{f.val}</code>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div className="label" style={{ margin: 0 }}>Beneficiary</div>
          <code style={{ fontSize: '0.78rem', color: 'var(--text-1)', fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace' }}>{(beneficiary as string) || '—'}</code>
        </div>
      </div>

      {/* Pause */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="label" style={{ marginBottom: '0.15rem' }}>Vault Status</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6, maxWidth: '380px', margin: 0 }}>
            When paused, deposits and claims are blocked. Withdrawals remain available.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={isPaused ? 'pill-danger' : 'pill-success'}>{isPaused ? 'Paused' : 'Active'}</span>
          <button className={isPaused ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }} onClick={handlePauseToggle} disabled={isPending}>
            {isPaused ? 'Unpause' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Timeout */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.15rem' }}>Timeout Period</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
          Currently <strong>{timeoutDays} days</strong>. Minimum: 7 days.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><label className="label">New timeout (days)</label><input className="input-field" type="number" min="7" placeholder={timeoutDays} value={newTimeout} onChange={(e) => setNewTimeout(e.target.value)} /></div>
          <button className="btn-primary" disabled={!newTimeout || isPending} onClick={handleTimeoutChange} style={{ flexShrink: 0 }}>Update</button>
        </div>
      </div>

      {/* Beneficiary change */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.15rem' }}>Change Beneficiary</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
          Changes require a <strong>3-day timelock</strong>. Propose, wait, then execute. Cancel anytime.
        </p>

        {hasPending && (
          <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.875rem 1rem', marginBottom: '0.75rem' }}>
            <div className="label" style={{ color: 'var(--accent)' }}>Pending Change</div>
            <code style={{ fontSize: '0.78rem', color: 'var(--text-1)', fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace', display: 'block', margin: '0.25rem 0' }}>{pendingBen as string}</code>
            {canExecute ? <span className="pill-success">Ready to execute</span> : <span className="pill-accent">~{timelockRemaining}h remaining</span>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button className="btn-primary" disabled={!canExecute || isPending} onClick={handleExecute} style={{ flex: 1 }}>Execute</button>
              <button className="btn-secondary" disabled={isPending} onClick={handleCancel} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        )}

        {!hasPending && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}><label className="label">New Beneficiary</label><input className="input-field" placeholder="0x..." value={newBen} onChange={(e) => setNewBen(e.target.value)} style={{ fontFamily: 'monospace' }} /></div>
            <button className="btn-primary" disabled={!newBen || isPending} onClick={handlePropose} style={{ flexShrink: 0 }}>Propose</button>
          </div>
        )}
      </div>
    </div>
  );
}
