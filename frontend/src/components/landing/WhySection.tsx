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
    <section id="why" className="max-w-[1100px] mx-auto px-6 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.55 }}
      >
        <p className="section-label mb-3">Why on-chain</p>
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-1 mb-4">
          Trustless beats trusted every time
        </h2>
        <p className="text-[0.95rem] text-text-3 max-w-[560px] leading-relaxed mb-12">
          Centralized inheritance services ask you to trust that a company still exists, has no conflicts of interest, and will faithfully execute your wishes decades from now. We remove all of that.
        </p>

        <div className="border border-border rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface">
                <th className="py-4 px-5 text-left text-xs font-semibold tracking-widest uppercase text-text-4 border-b border-border">Feature</th>
                <th className="py-4 px-5 text-left text-xs font-semibold tracking-widest uppercase text-accent border-b border-border">Chronos Vault</th>
                <th className="py-4 px-5 text-left text-xs font-semibold tracking-widest uppercase text-text-4 border-b border-border">Centralized Alternatives</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-bg' : 'bg-bg-alt'}>
                  <td className="py-4 px-5 text-sm text-text-2 border-b border-border font-medium">{row.feature}</td>
                  <td className="py-4 px-5 text-sm text-success border-b border-border bg-success-bg font-medium">
                    <span className="flex items-center gap-2">
                      <span className="text-[10px]">●</span>
                      {row.chronos}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-sm text-text-3 border-b border-border">{row.central}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </section>
  );
}
