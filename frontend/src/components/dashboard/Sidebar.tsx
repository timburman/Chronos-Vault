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

const beneficiaryNav = [
  { id: 'claim', label: 'Claim Inheritance' },
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
        padding: '1.5rem 1rem',
        height: '100%',
        gap: '0.25rem',
      }}
    >
      {/* App wordmark inside sidebar */}
      <div style={{
        fontFamily: 'var(--font-serif), serif',
        fontSize: '1.1rem',
        color: 'var(--text-1)',
        padding: '0.25rem 0.75rem',
        marginBottom: '1.25rem',
        letterSpacing: '-0.01em',
      }}>
        Chronos Vault
      </div>

      {isOwner && (
        <>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 0.75rem', marginBottom: '0.375rem', marginTop: '0.5rem' }}>
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

      {isBeneficiary && (
        <>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 0.75rem', marginBottom: '0.375rem', marginTop: '1rem' }}>
            Beneficiary
          </div>
          {beneficiaryNav.map((item) => (
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

      <div style={{ flex: 1 }} />

      <a
        href="/"
        style={{ textDecoration: 'none' }}
      >
        <button className="nav-link" style={{ marginBottom: '0.25rem' }}>
          Back to Home
        </button>
      </a>
    </aside>
  );
}
