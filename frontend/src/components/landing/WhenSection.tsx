'use client';
import { motion } from 'framer-motion';

const scenarios = [
  {
    title: 'Sudden Incapacitation',
    body: 'A serious accident or illness prevents you from accessing your devices for months. Your beneficiary receives everything as your vault timeout expires without a ping.',
  },
  {
    title: 'Lost Private Keys',
    body: 'Your seed phrase was on a device that was destroyed. Rather than losing funds forever, a properly configured vault with a prior deposit provides a retrieval path for your heirs.',
  },
  {
    title: 'Extended Travel',
    body: 'Venturing into areas with no connectivity. You set a 90-day timeout knowing you will ping when you return. The protocol does not judge — it only measures time.',
  },
  {
    title: 'Estate Planning',
    body: 'Sophisticated holders with significant on-chain wealth can use Chronos Vault as a living digital estate plan, designating beneficiaries and updating them without legal intermediaries.',
  },
];

export default function WhenSection() {
  return (
    <section id="when" style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '7rem 2rem' }}>
        <div style={{ marginBottom: '3.5rem' }}>
          <p className="section-label" style={{ marginBottom: '0.75rem' }}>When it matters</p>
          <h2 style={{ fontFamily: 'var(--font-serif), serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', color: 'var(--text-1)' }}>
            Built for life's unpredictable moments
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          {scenarios.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.75rem',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.625rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', lineHeight: 1.75 }}>{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
