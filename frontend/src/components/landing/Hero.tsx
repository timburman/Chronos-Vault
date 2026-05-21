'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: i * 0.14, ease: 'easeOut' as const } }),
};

export default function Hero() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 pt-32 pb-20 md:pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
      {/* Left column */}
      <div>
        <motion.p
          custom={0} initial="hidden" animate="show" variants={fadeUp}
          className="section-label mb-5"
        >
          Trustless Inheritance Protocol
        </motion.p>

        <motion.h1
          custom={1} initial="hidden" animate="show" variants={fadeUp}
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-text-1 mb-6 leading-tight"
        >
          Your keys, your assets. Even after you're gone.
        </motion.h1>

        <motion.p
          custom={2} initial="hidden" animate="show" variants={fadeUp}
          className="text-base md:text-lg text-text-2 leading-relaxed max-w-[480px] mb-10"
        >
          LegacyForge is an open-source, decentralized dead man's switch.
          Deposit your crypto, set an inactivity timeout, and your beneficiary
          automatically inherits everything if you ever disappear — no lawyers, no intermediaries, no trust required.
        </motion.p>

        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp} className="flex flex-wrap gap-4">
          <Link href="/dashboard">
            <button className="btn-primary">Get Started</button>
          </Link>
          <a href="https://github.com/timburman/LegacyForge" target="_blank" rel="noopener noreferrer">
            <button className="btn-secondary">View on GitHub</button>
          </a>
        </motion.div>

        <motion.div
          custom={4} initial="hidden" animate="show" variants={fadeUp}
          className="mt-10 flex flex-wrap gap-8"
        >
          {[
            { label: 'Open Source', value: 'MIT License' },
            { label: 'Network', value: 'EVM Compatible' },
            { label: 'Custody', value: 'Non-custodial' },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-text-4 mb-1">{item.label}</div>
              <div className="text-sm text-text-2 font-medium">{item.value}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right column — decorative vault card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[500px] mx-auto md:max-w-none md:ml-auto"
      >
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl">
          {/* Simulated vault card */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="section-label mb-2">Vault Balance</div>
              <div className="font-serif text-3xl md:text-4xl text-text-1">2.500 ETH</div>
              <div className="text-text-3 text-sm mt-1">≈ $8,250.00</div>
            </div>
            <span className="pill-success shrink-0 ml-4">Active</span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-bg rounded-xl p-5 border border-border">
              <div className="text-[0.72rem] text-text-4 tracking-widest uppercase mb-3">Time Until Unlock</div>
              <div className="flex gap-4 md:gap-6">
                {[['28', 'Days'], ['14', 'Hrs'], ['32', 'Min']].map(([n, u]) => (
                  <div key={u} className="text-center">
                    <div className="font-serif text-3xl md:text-4xl text-text-1 leading-none">{n}</div>
                    <div className="text-[0.65rem] text-text-4 uppercase tracking-widest mt-1.5">{u}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg rounded-xl py-3 px-4 border border-border flex justify-between items-center">
              <span className="text-sm text-text-3">Beneficiary</span>
              <span className="font-mono text-xs md:text-sm text-text-2">0x742d...3A4F</span>
            </div>

            <Link href="/dashboard" className="w-full block">
              <button className="btn-accent w-full justify-center">
                Emit Proof of Life
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
