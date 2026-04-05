'use client';

import { useWriteContract } from 'wagmi';
import { VaultFactoryABI, FACTORY_ADDRESS } from '@/utils/abi';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props { onSuccess: () => void }

const TIMEOUT_PRESETS = [
  { label: '2 weeks',  days: 14 },
  { label: '1 month',  days: 30 },
  { label: '3 months', days: 90 },
  { label: '1 year',   days: 365 },
];

export default function CreateVaultModal({ onSuccess }: Props) {
  const [beneficiary, setBeneficiary] = useState('');
  const [days, setDays] = useState(30);

  const { writeContractAsync, isPending } = useWriteContract();

  const handleCreate = async () => {
    if (!beneficiary) return;
    try {
      await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: VaultFactoryABI,
        functionName: 'createVault',
        args: [beneficiary.trim() as `0x${string}`, BigInt(days * 86400)],
      });
      onSuccess();
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: '540px', margin: '3rem auto' }}
    >
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.8rem', color: 'var(--text-1)', marginBottom: '0.5rem' }}>
        Initialize Your Vault
      </h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '2rem' }}>
        Deploy a personal, isolated smart contract vault on the current network. This is a one-time setup &mdash; your vault address is unique to your wallet.
      </p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Beneficiary */}
        <div>
          <label className="label">Beneficiary Wallet Address</label>
          <input
            className="input-field"
            placeholder="0x..."
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            style={{ fontFamily: 'monospace' }}
          />
          <p style={{ fontSize: '0.76rem', color: 'var(--text-4)', marginTop: '0.375rem' }}>
            This address will be able to claim your assets after the timeout expires.
          </p>
        </div>

        {/* Timeout */}
        <div>
          <label className="label">Inactivity Timeout</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {TIMEOUT_PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: `1px solid ${days === p.days ? 'var(--accent)' : 'var(--border)'}`,
                  background: days === p.days ? 'var(--accent-bg)' : 'var(--bg)',
                  color: days === p.days ? 'var(--accent)' : 'var(--text-3)',
                  fontSize: '0.82rem',
                  fontWeight: days === p.days ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-4)', marginTop: '0.5rem' }}>
            How long before your beneficiary can claim: <strong style={{ color: 'var(--text-2)' }}>{days} days</strong> of inactivity.
          </p>
        </div>

        <button
          className="btn-accent"
          style={{ justifyContent: 'center', padding: '0.875rem' }}
          disabled={!beneficiary || isPending}
          onClick={handleCreate}
        >
          {isPending ? 'Deploying Vault…' : 'Deploy My Vault'}
        </button>
      </div>
    </motion.div>
  );
}
