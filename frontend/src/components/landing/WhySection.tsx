'use client';
import { motion } from 'framer-motion';

const rows = [
  { feature: 'Custody of funds',        chronos: 'Self — always',    central: 'Third party holds them' },
  { feature: 'Execution reliability',   chronos: 'Deterministic',    central: 'Manual / discretionary' },
  { feature: 'Privacy',                 chronos: 'On-chain only',    central: 'Requires KYC / documents' },
  { feature: 'Censorship resistance',   chronos: 'Full',             central: 'Account can be frozen' },
  { feature: 'Cost to maintain',        chronos: 'Gas for pings',    central: 'Annual fees / legal costs' },
  { feature: 'Trust required',          chronos: 'Zero',             central: 'Company + legal system' },
];

export default function WhySection() {
  return (
    <section id="why" style={{ maxWidth: '1100px', margin: '0 auto', padding: '7rem 2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
      >
        <p className="section-label" style={{ marginBottom: '0.75rem' }}>Why on-chain</p>
        <h2 style={{ fontFamily: 'var(--font-serif), serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', color: 'var(--text-1)', marginBottom: '0.75rem' }}>
          Trustless beats trusted every time
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-3)', maxWidth: '560px', lineHeight: 1.75, marginBottom: '3rem' }}>
          Centralized inheritance services ask you to trust that a company still exists, has no conflicts of interest, and will faithfully execute your wishes decades from now. We remove all of that.
        </p>

        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)' }}>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', borderBottom: '1px solid var(--border)' }}>Feature</th>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>Chronos Vault</th>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', borderBottom: '1px solid var(--border)' }}>Centralized Alternatives</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-alt)' }}>
                  <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{row.feature}</td>
                  <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: 'var(--success)', borderBottom: '1px solid var(--border)' }}>{row.chronos}</td>
                  <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{row.central}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </section>
  );
}
