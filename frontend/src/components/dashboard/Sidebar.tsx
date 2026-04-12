'use client';

import {
  LayoutDashboard, Gem, ArrowDownToLine, ArrowUpFromLine,
  History, ShieldCheck, Settings, KeyRound, Home,
} from 'lucide-react';

type Section = 'overview' | 'assets' | 'deposit' | 'withdraw' | 'activity' | 'guardians' | 'settings' | 'claim';

interface Props {
  active: Section;
  onChange: (s: Section) => void;
  isOwner: boolean;
  isBeneficiary: boolean;
}

const ownerNav = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'assets', label: 'Assets', Icon: Gem },
  { id: 'deposit', label: 'Deposit', Icon: ArrowDownToLine },
  { id: 'withdraw', label: 'Withdraw', Icon: ArrowUpFromLine },
  { id: 'activity', label: 'Activity', Icon: History },
  { id: 'guardians', label: 'Guardians', Icon: ShieldCheck },
  { id: 'settings', label: 'Settings', Icon: Settings },
] as const;

export default function Sidebar({ active, onChange, isOwner, isBeneficiary }: Props) {
  return (
    <aside style={{
      width: '200px', flexShrink: 0, background: 'var(--bg-alt)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      padding: '1rem 0.75rem', overflowY: 'auto', gap: '0.15rem',
    }}>
      {isOwner && (
        <>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 0.75rem', marginBottom: '0.25rem', marginTop: '0.25rem' }}>
            Vault
          </div>
          {ownerNav.map((item) => (
            <button key={item.id} className={`nav-link ${active === item.id ? 'active' : ''}`} onClick={() => onChange(item.id)}>
              <item.Icon size={16} strokeWidth={1.8} />
              {item.label}
            </button>
          ))}
        </>
      )}

      {!isOwner && isBeneficiary && (
        <>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 0.75rem', marginBottom: '0.25rem', marginTop: '0.25rem' }}>
            Vault
          </div>
          <button className={`nav-link ${active !== 'claim' ? 'active' : ''}`} onClick={() => onChange('overview')}>
            <LayoutDashboard size={16} strokeWidth={1.8} />
            Initialize Vault
          </button>
        </>
      )}

      {isBeneficiary && (
        <>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 0.75rem', marginBottom: '0.25rem', marginTop: '0.75rem' }}>
            Beneficiary
          </div>
          <button className={`nav-link ${active === 'claim' ? 'active' : ''}`} onClick={() => onChange('claim')}>
            <KeyRound size={16} strokeWidth={1.8} />
            Claim Inheritance
          </button>
        </>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        <a href="https://github.com/timburman/Chronos-Vault" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="nav-link" style={{ fontSize: '0.78rem' }}>
            GitHub
          </button>
        </a>
        <a href="/" style={{ textDecoration: 'none' }}>
          <button className="nav-link" style={{ fontSize: '0.78rem' }}>
            <Home size={14} strokeWidth={1.8} />
            Back to Home
          </button>
        </a>
      </div>
    </aside>
  );
}
