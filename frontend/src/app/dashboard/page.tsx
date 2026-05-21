'use client';

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useCallback, useEffect } from 'react';
import { VaultFactoryABI, VaultABI, FACTORY_ADDRESS } from '@/utils/abi';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/dashboard/Sidebar';
import Link from 'next/link';
import { Activity, ShieldCheck, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '@/components/ThemeToggle';

const Overview = dynamic(() => import('@/components/dashboard/Overview'), { ssr: false });
const Assets = dynamic(() => import('@/components/dashboard/Assets'), { ssr: false });
const Deposit = dynamic(() => import('@/components/dashboard/Deposit'), { ssr: false });
const Withdraw = dynamic(() => import('@/components/dashboard/Withdraw'), { ssr: false });
const ActivityView = dynamic(() => import('@/components/dashboard/Activity'), { ssr: false });
const Guardians = dynamic(() => import('@/components/dashboard/Guardians'), { ssr: false });
const Settings = dynamic(() => import('@/components/dashboard/Settings'), { ssr: false });
const Claim = dynamic(() => import('@/components/dashboard/Claim'), { ssr: false });
const CreateVaultModal = dynamic(() => import('@/components/dashboard/CreateVaultModal'), { ssr: false });

type Section = 'overview' | 'assets' | 'deposit' | 'withdraw' | 'activity' | 'guardians' | 'settings' | 'claim';

import { usePublicClient } from 'wagmi';

// ─── Guardian Mode Panel ──────────────────────────────────────────────

function GuardianPanel({ vaultAddress }: { vaultAddress: `0x${string}` }) {
  const { data: lastPing } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'lastPingTime' });
  const { data: timeout } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: owner } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'owner' });
  const { data: isPaused } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'paused' });
  const { writeContractAsync, isPending } = useWriteContract();
  const publicClient = usePublicClient();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  let pct = 0, d = 0, h = 0, m = 0, s = 0;
  if (lastPing && timeout) {
    const unlockMs = (Number(lastPing) + Number(timeout)) * 1000;
    const totalMs = Number(timeout) * 1000;
    const remaining = Math.max(0, unlockMs - now);
    pct = Math.min(100, ((totalMs - remaining) / totalMs) * 100);
    d = Math.floor(remaining / 86400000);
    h = Math.floor((remaining % 86400000) / 3600000);
    m = Math.floor((remaining % 3600000) / 60000);
    s = Math.floor((remaining % 60000) / 1000);
  }

  const handlePing = async () => {
    const tid = toast.loading('Broadcasting ping...');
    try {
      const hash = await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'ping' });
      toast.loading('Waiting for confirmation...', { id: tid });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      toast.success('Ping confirmed — timer reset', { id: tid });
    } catch { toast.error('Ping failed — are you still a guardian?', { id: tid }); }
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Guardian View</h1>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
        <div className="icon-box icon-box-success" style={{ width: '40px', height: '40px' }}>
          <ShieldCheck size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="label" style={{ margin: 0 }}>Guardian Access</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: '0.15rem' }}>
            You can ping this vault to keep it alive
          </div>
        </div>
        {isPaused && <span className="pill-danger">Paused</span>}
      </div>

      <div className="card-sm">
        <div className="label" style={{ margin: 0, marginBottom: '0.1rem' }}>Vault Owner</div>
        <code style={{ fontSize: '0.78rem', color: 'var(--text-2)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{(owner as string) || '...'}</code>
      </div>

      {/* Countdown */}
      <div className="card" style={{ padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div className="label">Time Until Unlock</div>
            {pct > 75 ? <span className="pill-danger" style={{ marginTop: '0.25rem' }}>Ping Required</span> : <span className="pill-success" style={{ marginTop: '0.25rem' }}>Active</span>}
          </div>
          <button className="btn-accent" disabled={isPending} onClick={handlePing} style={{ minWidth: '120px', justifyContent: 'center' }}>
            <Activity size={14} />
            {isPending ? 'Pinging...' : 'Ping'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
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
      </div>
    </div>
  );
}

// ─── Guardian Vault Input ──────────────────────────────────────────────

function GuardianVaultEntry({ onConfirm }: { onConfirm: (addr: `0x${string}`) => void }) {
  const { address } = useAccount();
  const [vaultAddr, setVaultAddr] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  // Load saved guardian vaults
  const [savedVaults, setSavedVaults] = useState<`0x${string}`[]>([]);
  useEffect(() => {
    if (!address || typeof window === 'undefined' || !window.localStorage) return;
    try {
      const saved = window.localStorage.getItem(`cv_guardian_vaults_${address}`);
      if (saved) setSavedVaults(JSON.parse(saved));
    } catch { }
  }, [address]);

  const handleCheck = async () => {
    if (vaultAddr.length !== 42) { setError('Enter a valid address'); return; }
    setChecking(true); setError('');
    // Will be validated by onConfirm attempting to read
    const addr = vaultAddr.trim() as `0x${string}`;
    // Save to localStorage
    if (address) {
      const updated = [...new Set([...savedVaults, addr])];
      localStorage.setItem(`cv_guardian_vaults_${address}`, JSON.stringify(updated));
    }
    onConfirm(addr);
    setChecking(false);
  };

  return (
    <div className="dashboard-content" style={{ margin: '2rem 0' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-1)', marginBottom: '0.35rem' }}>Guardian Access</h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Enter the vault address you're guarding to view its status and send pings.
      </p>

      {savedVaults.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="label" style={{ marginBottom: '0.5rem' }}>Saved Vaults</div>
          {savedVaults.map((v) => (
            <button key={v} onClick={() => onConfirm(v)} className="token-row" style={{ width: '100%', border: 'none', textAlign: 'left' }}>
              <code style={{ fontSize: '0.78rem', color: 'var(--text-1)', fontFamily: 'monospace' }}>{v}</code>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>Open</span>
            </button>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Vault Address</label>
            <input className="input-field" placeholder="0x..." value={vaultAddr} onChange={(e) => { setVaultAddr(e.target.value); setError(''); }} style={{ fontFamily: 'monospace' }} />
          </div>
          <button className="btn-primary" disabled={checking} onClick={handleCheck} style={{ flexShrink: 0 }}>Access</button>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [section, setSection] = useState<Section>('overview');
  const [selectedVaultIdx, setSelectedVaultIdx] = useState(0);
  const [guardianVault, setGuardianVault] = useState<`0x${string}` | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: ownerVaultsRaw, refetch: refetchOwner } = useReadContract({
    address: FACTORY_ADDRESS, abi: VaultFactoryABI, functionName: 'getOwnerVaults',
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: benVaultsRaw } = useReadContract({
    address: FACTORY_ADDRESS, abi: VaultFactoryABI, functionName: 'getBeneficiaryVaults',
    args: address ? [address] : undefined, query: { enabled: !!address },
  });

  // Check if user is a guardian of the selected guardian vault
  const { data: isGuardian } = useReadContract({
    address: guardianVault || undefined, abi: VaultABI, functionName: 'guardians',
    args: address ? [address] : undefined,
    query: { enabled: !!guardianVault && !!address },
  });

  const ownerVaults = (ownerVaultsRaw as `0x${string}`[]) || [];
  const benVaults = (benVaultsRaw as `0x${string}`[]) || [];
  const hasVault = ownerVaults.length > 0;
  const isBeneficiary = benVaults.length > 0;
  const vaultAddress = hasVault ? ownerVaults[selectedVaultIdx] || ownerVaults[0] : null;
  const benVaultAddress = isBeneficiary ? benVaults[0] : null;

  const handleVaultCreated = useCallback(() => { setTimeout(() => refetchOwner(), 2500); }, [refetchOwner]);

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DashboardHeader 
        ownerVaults={ownerVaults} 
        selectedVaultIdx={selectedVaultIdx} 
        setSelectedVaultIdx={setSelectedVaultIdx} 
        onToggleSidebar={isConnected ? () => setSidebarOpen(!sidebarOpen) : undefined} 
      />

      {!isConnected ? (
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-[400px] w-full p-8 bg-surface border border-border rounded-2xl shadow-sm">
            <div className="font-serif text-2xl text-text-1 mb-3">Welcome to LegacyForge</div>
            <p className="text-sm text-text-3 mb-8 leading-relaxed">
              Connect your wallet to access the vault dashboard, manage your inheritance plans, or claim assets as a beneficiary.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
          <Link href="/" className="mt-8 text-xs text-text-4 hover:text-text-2 transition-colors no-underline">
            ← Back to landing page
          </Link>
        </main>
      ) : guardianVault && isGuardian ? (
        <div className="dashboard-wrapper flex flex-1 overflow-hidden">
          <aside className={`sidebar-desktop ${sidebarOpen ? 'open' : ''}`} style={{ width: '200px', flexShrink: 0, background: 'var(--bg-alt)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '1rem 0.75rem', gap: '0.15rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 0.75rem', marginBottom: '0.25rem' }}>Guardian</div>
            <button className="nav-link active"><ShieldCheck size={16} strokeWidth={1.8} /> Guardian View</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setGuardianVault(null)} className="nav-link" style={{ fontSize: '0.78rem', color: 'var(--text-4)' }}>Back to Dashboard</button>
          </aside>
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
          <main className="dashboard-main flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
            <div style={{ width: '100%', maxWidth: '780px' }}>
              <GuardianPanel vaultAddress={guardianVault} />
            </div>
          </main>
        </div>
      ) : (
        <div className="dashboard-wrapper flex flex-1 overflow-hidden">
          <Sidebar active={section} onChange={(s) => { setSection(s); setSidebarOpen(false); }} isOwner={hasVault} isBeneficiary={isBeneficiary} isOpen={sidebarOpen} />
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
          <main className="dashboard-main flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
            <div style={{ width: '100%', maxWidth: '780px' }}>
              {!hasVault && section !== 'claim' && (
                <div className="flex flex-col gap-6 w-full">
                  <CreateVaultModal onSuccess={handleVaultCreated} />
                  <div style={{ maxWidth: '540px' }}>
                    <GuardianVaultEntry onConfirm={(addr) => setGuardianVault(addr)} />
                  </div>
                </div>
              )}
              {hasVault && (
                <>
                  {section === 'overview' && <Overview vaultAddress={vaultAddress!} />}
                  {section === 'assets' && <Assets vaultAddress={vaultAddress!} />}
                  {section === 'deposit' && <Deposit vaultAddress={vaultAddress!} />}
                  {section === 'withdraw' && <Withdraw vaultAddress={vaultAddress!} />}
                  {section === 'activity' && <ActivityView vaultAddress={vaultAddress!} />}
                  {section === 'guardians' && <Guardians vaultAddress={vaultAddress!} />}
                  {section === 'settings' && <Settings vaultAddress={vaultAddress!} />}
                  {section === 'claim' && benVaultAddress && <Claim vaultAddress={benVaultAddress} />}
                </>
              )}
              {!hasVault && isBeneficiary && section === 'claim' && <Claim vaultAddress={benVaultAddress!} />}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────

function DashboardHeader({ ownerVaults, selectedVaultIdx, setSelectedVaultIdx, onToggleSidebar }: {
  ownerVaults: `0x${string}`[]; selectedVaultIdx: number; setSelectedVaultIdx: (i: number) => void; onToggleSidebar?: () => void;
}) {
  return (
    <header className="h-[52px] shrink-0 bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between px-2 md:px-6 z-40 sticky top-0 w-full">
      <div className="flex items-center gap-1 md:gap-5">
        {onToggleSidebar && (
          <button className="mobile-nav-toggle btn-ghost p-1" onClick={onToggleSidebar}>
            <Menu size={20} />
          </button>
        )}
        <Link href="/" className="no-underline flex items-center">
          <span className="font-serif text-sm md:text-base text-text-1 tracking-tight hidden sm:inline">LegacyForge</span>
          <span className="font-serif text-sm text-text-1 tracking-tight sm:hidden">LF</span>
        </Link>
        {ownerVaults.length > 1 && (
          <select value={selectedVaultIdx} onChange={(e) => setSelectedVaultIdx(Number(e.target.value))}
            className="bg-surface border border-border rounded-md py-1 px-1.5 text-[10px] md:text-xs text-text-2 font-mono cursor-pointer outline-none focus:border-accent-dim hidden lg:block">
            {ownerVaults.map((v, i) => <option key={v} value={i}>Vault {i + 1}: {v.slice(0, 6)}...{v.slice(-4)}</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1 md:gap-6">
        <div className="hidden xl:flex gap-6">
          <a href="/#how" className="text-xs text-text-3 hover:text-text-1 no-underline transition-colors">How it works</a>
          <a href="https://github.com/timburman/LegacyForge" target="_blank" rel="noopener noreferrer" className="text-xs text-text-3 hover:text-text-1 no-underline transition-colors">GitHub</a>
        </div>
        <div className="flex items-center gap-1 md:gap-3">
          <ThemeToggle />
          <div className="scale-75 sm:scale-90 md:scale-100 origin-right">
            <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
          </div>
        </div>
      </div>
    </header>
  );
}
