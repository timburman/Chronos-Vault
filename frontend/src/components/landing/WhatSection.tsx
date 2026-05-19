'use client';
import { motion } from 'framer-motion';

export default function WhatSection() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 py-20 md:py-28">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
        {/* Problem */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55 }}
        >
          <p className="section-label mb-4">The Problem</p>
          <h2 className="font-serif text-3xl md:text-4xl text-text-1 mb-6 leading-snug">
            True self-custody has no password reset
          </h2>
          <div className="flex flex-col gap-5">
            {[
              'Billions in crypto are permanently locked due to lost keys, unexpected accidents, and lack of estate planning.',
              'Traditional solutions — centralized exchanges, hardware backups — all carry single points of failure or counterparty risk.',
              'Lawyers and courts cannot interpret a seed phrase. There is no bureaucratic recourse for a private key.',
            ].map((text, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-danger mt-2 shrink-0" />
                <p className="text-[0.95rem] text-text-3 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Solution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <p className="section-label mb-4">The Solution</p>
          <h2 className="font-serif text-3xl md:text-4xl text-text-1 mb-6 leading-snug">
            A trustless, time-locked inheritance protocol
          </h2>
          <div className="flex flex-col gap-5">
            {[
              'A smart contract automatically routes your assets to a beneficiary when your wallet goes silent past a set threshold.',
              'No third party ever holds your keys or assets. The logic lives entirely on-chain and cannot be altered or censored.',
              'Deterministic execution — if the countdown reaches zero, it executes. No grey areas, no human interpretation.',
            ].map((text, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                <p className="text-[0.95rem] text-text-3 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
