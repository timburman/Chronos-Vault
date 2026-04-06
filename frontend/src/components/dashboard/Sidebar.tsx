'use client';

type Section = 'overview' | 'assets' | 'deposit' | 'withdraw' | 'settings' | 'claim';

interface Props {
  active: Section;
  onChange: (s: Section) => void;
  isOwner: boolean;
  isBeneficiary: boolean;
}

const ownerNav = [
  { id: 'overview',  label: 'Overview' },
  { id: 'assets',    label: 'Assets' },
  { id: 'deposit',   label: 'Deposit' },
  { id: 'withdraw',  label: 'Withdraw' },
  { id: 'settings',  label: 'Settings' },
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
        // ↓ This is the key: sidebar must not control its own height,
        //   it inherits 100% from the flex parent which has overflow:hidden
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
            Claim Inheritance
          </button>
        </>
      )}

      {/* Spacer to push footer link to bottom */}
      <div style={{ flex: 1 }} />

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <a href="https://github.com/timburman/Chronos-Vault" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="nav-link" style={{ fontSize: '0.78rem' }}>
            GitHub
          </button>
        </a>
        <a href="/" style={{ textDecoration: 'none' }}>
          <button className="nav-link" style={{ fontSize: '0.78rem' }}>
            Back to Home
          </button>
        </a>
      </div>
    </aside>
  );
}
