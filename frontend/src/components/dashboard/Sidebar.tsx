'use client';

type Section = 'overview' | 'assets' | 'deposit' | 'withdraw' | 'activity' | 'guardians' | 'settings' | 'claim';

interface Props {
  active: Section;
  onChange: (s: Section) => void;
  isOwner: boolean;
  isBeneficiary: boolean;
}

const ownerNav = [
  { id: 'overview',  label: 'Overview',   icon: '📊' },
  { id: 'assets',    label: 'Assets',     icon: '💎' },
  { id: 'deposit',   label: 'Deposit',    icon: '⬇️' },
  { id: 'withdraw',  label: 'Withdraw',   icon: '⬆️' },
  { id: 'activity',  label: 'Activity',   icon: '📜' },
  { id: 'guardians', label: 'Guardians',  icon: '🛡️' },
  { id: 'settings',  label: 'Settings',   icon: '⚙️' },
] as const;

export default function Sidebar({ active, onChange, isOwner, isBeneficiary }: Props) {
  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--bg-alt)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 1rem',
        overflowY: 'auto',
        gap: '0.25rem',
      }}
    >
      {/* Owner nav */}
      {isOwner && (
        <>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 0.75rem', marginBottom: '0.375rem', marginTop: '0.25rem' }}>
            My Vault
          </div>
          {ownerNav.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${active === item.id ? 'active' : ''}`}
              onClick={() => onChange(item.id)}
            >
              <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </>
      )}

      {/* Beneficiary-only: can also create their own vault */}
      {!isOwner && isBeneficiary && (
        <>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 0.75rem', marginBottom: '0.375rem', marginTop: '0.25rem' }}>
            My Vault
          </div>
          <button
            className={`nav-link ${active !== 'claim' ? 'active' : ''}`}
            onClick={() => onChange('overview')}
          >
            <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>🔨</span>
            Initialize Vault
          </button>
        </>
      )}

      {/* Beneficiary claim section */}
      {isBeneficiary && (
        <>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 0.75rem', marginBottom: '0.375rem', marginTop: '1rem' }}>
            Beneficiary
          </div>
          <button
            className={`nav-link ${active === 'claim' ? 'active' : ''}`}
            onClick={() => onChange('claim')}
          >
            <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>🏛️</span>
            Claim Inheritance
          </button>
        </>
      )}

      {/* Spacer to push footer link to bottom */}
      <div style={{ flex: 1 }} />

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <a href="https://github.com/timburman/Chronos-Vault" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="nav-link" style={{ fontSize: '0.78rem' }}>
            <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>📁</span>
            GitHub
          </button>
        </a>
        <a href="/" style={{ textDecoration: 'none' }}>
          <button className="nav-link" style={{ fontSize: '0.78rem' }}>
            <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>🏠</span>
            Back to Home
          </button>
        </a>
      </div>
    </aside>
  );
}
