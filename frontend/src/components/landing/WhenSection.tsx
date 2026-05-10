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
    <section id="when" className="bg-bg-alt border-y border-border">
      <div className="max-w-[1100px] mx-auto px-6 py-20 md:py-28">
        <div className="mb-14">
          <p className="section-label mb-3">When it matters</p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-1">
            Built for life's unpredictable moments
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="bg-bg border border-border rounded-xl p-8"
            >
              <h3 className="text-lg font-semibold text-text-1 mb-3">{s.title}</h3>
              <p className="text-[0.95rem] text-text-3 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
