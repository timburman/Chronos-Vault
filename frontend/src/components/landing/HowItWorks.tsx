'use client';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Deploy Your Vault',
    body: "Connect your wallet and deploy a personal, isolated smart contract vault in seconds. Your contract is yours — the factory registry simply keeps track of its address. No admin keys, no upgrade proxies.",
  },
  {
    num: '02',
    title: 'Deposit & Configure',
    body: "Send ETH or any ERC-20 token directly into your vault. Set a beneficiary address and choose an inactivity timeout — anywhere from 7 days to several years. You are in complete control.",
  },
  {
    num: '03',
    title: 'Ping to Stay Active',
    body: 'Once a vault is live, simply "ping" it periodically to reset the countdown timer. This is your proof of life. If the timer ever reaches zero without a ping, the vault unlocks for your beneficiary to claim.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ marginBottom: '3.5rem' }}>
          <p className="section-label" style={{ marginBottom: '0.75rem' }}>Mechanism</p>
          <h2 style={{ fontFamily: 'var(--font-serif), serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', color: 'var(--text-1)' }}>
            How Chronos Vault works
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '2rem',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-serif), serif',
                fontSize: '2.4rem',
                color: 'var(--accent-dim)',
                marginBottom: '1rem',
                lineHeight: 1,
              }}>
                {step.num}
              </div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-1)', marginBottom: '0.75rem', fontWeight: 600 }}>{step.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', lineHeight: 1.75 }}>{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
