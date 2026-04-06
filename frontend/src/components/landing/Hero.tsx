'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: i * 0.14, ease: 'easeOut' as const } }),
};

export default function Hero() {
  return (
    <section
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '7rem 2rem 6rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4rem',
        alignItems: 'center',
      }}
    >
      {/* Left column */}
      <div>
        <motion.p
          custom={0} initial="hidden" animate="show" variants={fadeUp}
          className="section-label" style={{ marginBottom: '1.25rem' }}
        >
          Trustless Inheritance Protocol
        </motion.p>

        <motion.h1
          custom={1} initial="hidden" animate="show" variants={fadeUp}
          style={{
            fontFamily: 'var(--font-serif), DM Serif Display, serif',
            fontSize: 'clamp(2.6rem, 5vw, 3.6rem)',
            color: 'var(--text-1)',
            marginBottom: '1.5rem',
          }}
        >
          Your keys, your assets. Even after you're gone.
        </motion.h1>

        <motion.p
          custom={2} initial="hidden" animate="show" variants={fadeUp}
          style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '480px', marginBottom: '2.5rem' }}
        >
          Chronos Vault is an open-source, decentralized dead man's switch.
          Deposit your crypto, set an inactivity timeout, and your beneficiary
          automatically inherits everything if you ever disappear — no lawyers, no intermediaries, no trust required.
        </motion.p>

        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard">
            <button className="btn-primary">Get Started</button>
          </Link>
          <a href="https://github.com/timburman/Chronos-Vault" target="_blank" rel="noopener noreferrer">
            <button className="btn-secondary">View on GitHub</button>
          </a>
        </motion.div>

        <motion.div
          custom={4} initial="hidden" animate="show" variants={fadeUp}
          style={{ marginTop: '2.5rem', display: 'flex', gap: '2rem' }}
        >
          {[
            { label: 'Open Source', value: 'MIT License' },
            { label: 'Network', value: 'EVM Compatible' },
            { label: 'Custody', value: 'Non-custodial' },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '0.25rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right column — decorative vault card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 2px 40px rgba(0,0,0,0.07)',
          }}
        >
          {/* Simulated vault card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <div className="section-label" style={{ marginBottom: '0.5rem' }}>Vault Balance</div>
              <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '2.4rem', color: 'var(--text-1)' }}>2.500 ETH</div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginTop: '0.25rem' }}>≈ $8,250.00</div>
            </div>
            <span className="pill-success">Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Time Until Unlock</div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[['28', 'Days'], ['14', 'Hrs'], ['32', 'Min']].map(([n, u]) => (
                  <div key={u} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)', lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.2rem' }}>{u}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '0.875rem 1rem', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Beneficiary</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-2)' }}>0x742d...3A4F</span>
            </div>

            <Link href="/dashboard">
              <button className="btn-accent" style={{ width: '100%', justifyContent: 'center' }}>
                Emit Proof of Life
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
