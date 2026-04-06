'use client';
import Link from 'next/link';

export default function OpenSourceSection() {
  return (
    <>
      {/* Open Source Strip */}
      <section style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '3rem 2rem',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p className="section-label" style={{ marginBottom: '0.5rem' }}>Open Source</p>
            <h3 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.4rem', color: 'var(--text-1)' }}>Inspect every line. Fork freely.</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', marginTop: '0.5rem', maxWidth: '480px' }}>
              Chronos Vault is MIT licensed. The smart contracts, factory, and this interface are fully open sourced on GitHub.
              Security researchers, auditors, and the curious are all welcome.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
            <a href="https://github.com/timburman/Chronos-Vault" target="_blank" rel="noopener noreferrer">
              <button className="btn-secondary">View on GitHub</button>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: 'var(--bg)', padding: '7rem 2rem', textAlign: 'center' }}>
        <p className="section-label" style={{ marginBottom: '1rem' }}>Start now</p>
        <h2 style={{
          fontFamily: 'var(--font-serif), serif',
          fontSize: 'clamp(2rem, 4vw, 3.2rem)',
          color: 'var(--text-1)',
          marginBottom: '1.25rem',
          maxWidth: '600px',
          margin: '0 auto 1.25rem',
        }}>
          Secure your legacy in under five minutes.
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-3)', marginBottom: '2.5rem' }}>
          No sign-up. No custody. Just your wallet and a smart contract.
        </p>
        <Link href="/dashboard">
          <button className="btn-accent" style={{ fontSize: '0.95rem', padding: '0.875rem 2rem' }}>
            Launch Your Vault
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem', background: 'var(--bg-alt)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontFamily: 'var(--font-serif), serif', color: 'var(--text-3)', fontSize: '0.9rem' }}>Chronos Vault</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-4)' }}>MIT License · Non-custodial · Open Source</span>
        </div>
      </footer>
    </>
  );
}
