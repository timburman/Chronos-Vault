'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { useState, useEffect } from 'react';

interface Props { vaultAddress: `0x${string}` }

export default function Settings({ vaultAddress }: Props) {
  const [newBen, setNewBen] = useState('');
  const [newTimeout, setNewTimeout] = useState('');
  const [status, setStatus] = useState<'idle' | 'proposed' | 'executed' | 'cancelled' | 'err'>('idle');
  const [pauseStatus, setPauseStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [timeoutStatus, setTimeoutStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: beneficiary, refetch: refetchBen } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'beneficiary' });
  const { data: owner }     = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'owner' });
  const { data: timeout }   = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: factory }   = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'factory' });
  const { data: isPaused, refetch: refetchPause }   = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'paused' });
  const { data: pendingBen, refetch: refetchPending } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'pendingBeneficiary' });
  const { data: unlockTime } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'beneficiaryChangeUnlockTime' });

  const { writeContractAsync, isPending } = useWriteContract();

  const timeoutDays = timeout ? (Number(timeout) / 86400).toFixed(0) : '—';
  const hasPending = pendingBen && pendingBen !== '0x0000000000000000000000000000000000000000';
  const unlockMs = unlockTime ? Number(unlockTime) * 1000 : 0;
  const canExecute = hasPending && now >= unlockMs;
  const timelockRemaining = hasPending && unlockMs > now
    ? Math.ceil((unlockMs - now) / 3600000) // hours
    : 0;

  const handlePropose = async () => {
    if (!newBen) return;
    try {
      setStatus('idle');
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'proposeBeneficiaryChange', args: [newBen.trim() as `0x${string}`] });
      setStatus('proposed');
      setNewBen('');
      setTimeout(refetchPending, 2500);
    } catch { setStatus('err'); }
  };

  const handleExecute = async () => {
    try {
      setStatus('idle');
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'executeBeneficiaryChange' });
      setStatus('executed');
      setTimeout(() => { refetchBen(); refetchPending(); }, 2500);
    } catch { setStatus('err'); }
  };

  const handleCancel = async () => {
    try {
      setStatus('idle');
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'cancelBeneficiaryChange' });
      setStatus('cancelled');
      setTimeout(refetchPending, 2500);
    } catch { setStatus('err'); }
  };

  const handlePauseToggle = async () => {
    try {
      setPauseStatus('idle');
      await writeContractAsync({
        address: vaultAddress, abi: VaultABI,
        functionName: isPaused ? 'unpause' : 'pause',
      });
      setPauseStatus('ok');
      setTimeout(refetchPause, 2500);
    } catch { setPauseStatus('err'); }
  };

  const handleTimeoutChange = async () => {
    if (!newTimeout) return;
    const newPeriod = BigInt(parseInt(newTimeout) * 86400);
    try {
      setTimeoutStatus('idle');
      await writeContractAsync({
        address: vaultAddress, abi: VaultABI,
        functionName: 'changeTimeoutPeriod', args: [newPeriod],
      });
      setTimeoutStatus('ok');
      setNewTimeout('');
    } catch { setTimeoutStatus('err'); }
  };

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

      {/* Pause Toggle */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label" style={{ marginBottom: '0.25rem' }}>Vault Status</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.65, maxWidth: '400px' }}>
              When paused, deposits and claims are blocked. Withdrawals remain available.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={isPaused ? 'pill-danger' : 'pill-success'}>
              {isPaused ? 'Paused' : 'Active'}
            </span>
            <button
              className={isPaused ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
              onClick={handlePauseToggle}
              disabled={isPending}
            >
              {isPaused ? 'Unpause' : 'Pause'}
            </button>
          </div>
        </div>
        {pauseStatus === 'ok'  && <p style={{ color: 'var(--success)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Vault status updated.</p>}
        {pauseStatus === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Transaction failed.</p>}
      </div>

      {/* Change Timeout */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Change Timeout Period</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1rem', lineHeight: 1.65 }}>
          Update how long the vault must be inactive before your beneficiary can claim. Minimum: 7 days. Currently: <strong>{timeoutDays} days</strong>.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">New Timeout (days)</label>
            <input className="input-field" type="number" min="7" placeholder={timeoutDays} value={newTimeout} onChange={(e) => setNewTimeout(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={!newTimeout || isPending} onClick={handleTimeoutChange} style={{ flexShrink: 0 }}>
            Update
          </button>
        </div>
        {timeoutStatus === 'ok'  && <p style={{ color: 'var(--success)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Timeout period updated.</p>}
        {timeoutStatus === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Failed. Minimum is 7 days.</p>}
      </div>

      {/* Change Beneficiary (with Timelock) */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Change Beneficiary</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1rem', lineHeight: 1.65 }}>
          Beneficiary changes go through a <strong>3-day timelock</strong> for security. Propose the change, wait 3 days, then execute it. You can cancel anytime before execution.
        </p>

        {/* Pending change banner */}
        {hasPending && (
          <div style={{
            background: 'var(--accent-bg)', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '1rem 1.25rem', marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.25rem' }}>
              Pending Beneficiary Change
            </div>
            <code style={{ fontSize: '0.82rem', color: 'var(--text-1)', fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace', display: 'block', marginBottom: '0.5rem' }}>
              {pendingBen as string}
            </code>
            {canExecute ? (
              <span className="pill-success">Ready to execute</span>
            ) : (
              <span className="pill-accent">
                Unlocks in ~{timelockRemaining} hour{timelockRemaining !== 1 ? 's' : ''}
              </span>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn-primary" disabled={!canExecute || isPending} onClick={handleExecute} style={{ flex: 1 }}>
                {isPending ? 'Executing…' : 'Execute Change'}
              </button>
              <button className="btn-secondary" disabled={isPending} onClick={handleCancel} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Propose new */}
        {!hasPending && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="label">New Beneficiary Address</label>
              <input className="input-field" placeholder="0x..." value={newBen} onChange={(e) => setNewBen(e.target.value)} style={{ fontFamily: 'monospace' }} />
            </div>
            <button className="btn-primary" disabled={!newBen || isPending} onClick={handlePropose} style={{ flexShrink: 0 }}>
              {isPending ? 'Proposing…' : 'Propose Change'}
            </button>
          </div>
        )}

        {status === 'proposed'  && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Change proposed. Execute after 3-day timelock.</p>}
        {status === 'executed'  && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Beneficiary updated successfully.</p>}
        {status === 'cancelled' && <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Pending change cancelled.</p>}
        {status === 'err'       && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Transaction failed.</p>}
      </div>
    </div>
  );
}
