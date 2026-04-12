'use client';

import { useWriteContract } from 'wagmi';
import { VaultFactoryABI, FACTORY_ADDRESS } from '@/utils/abi';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
    const tid = toast.loading('Deploying your vault...');
    try {
      await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: VaultFactoryABI,
        functionName: 'createVault',
        args: [beneficiary.trim() as `0x${string}`, BigInt(days * 86400)],
      });
      toast.success('Vault deployed successfully', { id: tid });
      onSuccess();
    } catch {
      toast.error('Deployment failed', { id: tid });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="dashboard-content" style={{ margin: '2rem 0' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-1)', marginBottom: '0.35rem' }}>Initialize Your Vault</h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Deploy a personal smart contract vault on the current chain. Your vault address is unique to your wallet.
      </p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label className="label">Beneficiary Wallet</label>
          <input className="input-field" placeholder="0x..." value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} style={{ fontFamily: 'monospace' }} />
          <p style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginTop: '0.25rem' }}>This address can claim your assets after the timeout expires.</p>
        </div>

        <div>
          <label className="label">Inactivity Timeout</label>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {TIMEOUT_PRESETS.map((p) => (
              <button key={p.days} onClick={() => setDays(p.days)} style={{
                padding: '0.4rem 0.875rem', borderRadius: '5px', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.12s',
                border: `1px solid ${days === p.days ? 'var(--accent)' : 'var(--border)'}`, background: days === p.days ? 'var(--accent-bg)' : 'var(--bg)',
                color: days === p.days ? 'var(--accent)' : 'var(--text-3)', fontWeight: days === p.days ? 600 : 400,
              }}>{p.label}</button>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginTop: '0.35rem' }}>Claim unlocks after <strong style={{ color: 'var(--text-2)' }}>{days} days</strong> of inactivity.</p>
        </div>

        <button className="btn-accent" style={{ justifyContent: 'center', padding: '0.75rem' }} disabled={!beneficiary || isPending} onClick={handleCreate}>
          {isPending ? 'Deploying...' : 'Deploy Vault'}
        </button>
      </div>
    </motion.div>
  );
}
