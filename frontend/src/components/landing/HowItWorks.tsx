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
    <section id="how" className="bg-bg-alt border-y border-border">
      <div className="max-w-[1100px] mx-auto px-6 py-20 md:py-24">
        <div className="mb-14">
          <p className="section-label mb-3">Mechanism</p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-1">
            How LegacyForge works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-bg border border-border rounded-xl p-8"
            >
              <div className="font-serif text-4xl text-accent-dim mb-4 leading-none">
                {step.num}
              </div>
              <h3 className="text-lg font-semibold text-text-1 mb-3">{step.title}</h3>
              <p className="text-sm text-text-3 leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
