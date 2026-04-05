'use client';
import { motion } from 'framer-motion';

export default function WhatSection() {
  return (
    <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '7rem 2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'start' }}>
        {/* Problem */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="section-label" style={{ marginBottom: '1rem' }}>The Problem</p>
          <h2 style={{ fontFamily: 'var(--font-serif), serif', fontSize: 'clamp(1.6rem, 2.8vw, 2rem)', color: 'var(--text-1)', marginBottom: '1.25rem' }}>
            True self-custody has no password reset
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              'Billions in crypto are permanently locked due to lost keys, unexpected accidents, and lack of estate planning.',
              'Traditional solutions — centralized exchanges,  hardware backups — all carry single points of failure or counterparty risk.',
              'Lawyers and courts cannot interpret a seed phrase. There is no bureaucratic recourse for a private key.',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--danger)', marginTop: '0.6rem', flexShrink: 0 }} />
                <p style={{ fontSize: '0.93rem', color: 'var(--text-3)', lineHeight: 1.75 }}>{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Solution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <p className="section-label" style={{ marginBottom: '1rem' }}>The Solution</p>
          <h2 style={{ fontFamily: 'var(--font-serif), serif', fontSize: 'clamp(1.6rem, 2.8vw, 2rem)', color: 'var(--text-1)', marginBottom: '1.25rem' }}>
            A trustless, time-locked inheritance protocol
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              'A smart contract automatically routes your assets to a beneficiary when your wallet goes silent past a set threshold.',
              'No third party ever holds your keys or assets. The logic lives entirely on-chain and cannot be altered or censored.',
              'Deterministic execution — if the countdown reaches zero, it executes. No grey areas, no human interpretation.',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--success)', marginTop: '0.6rem', flexShrink: 0 }} />
                <p style={{ fontSize: '0.93rem', color: 'var(--text-3)', lineHeight: 1.75 }}>{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
