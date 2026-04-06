'use client';

import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useCallback } from 'react';
import { VaultFactoryABI, FACTORY_ADDRESS } from '@/utils/abi';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/dashboard/Sidebar';
import Link from 'next/link';

const Overview         = dynamic(() => import('@/components/dashboard/Overview'),         { ssr: false });
const Assets           = dynamic(() => import('@/components/dashboard/Assets'),           { ssr: false });
const Deposit          = dynamic(() => import('@/components/dashboard/Deposit'),          { ssr: false });
const Withdraw         = dynamic(() => import('@/components/dashboard/Withdraw'),         { ssr: false });
const Settings         = dynamic(() => import('@/components/dashboard/Settings'),         { ssr: false });
const Claim            = dynamic(() => import('@/components/dashboard/Claim'),            { ssr: false });
const CreateVaultModal = dynamic(() => import('@/components/dashboard/CreateVaultModal'), { ssr: false });

type Section = 'overview' | 'assets' | 'deposit' | 'withdraw' | 'settings' | 'claim';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [section, setSection] = useState<Section>('overview');

  const { data: ownerVaultsRaw, refetch: refetchOwner } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: VaultFactoryABI,
    functionName: 'getOwnerVaults',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: benVaultsRaw } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: VaultFactoryABI,
    functionName: 'getBeneficiaryVaults',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const ownerVaults = (ownerVaultsRaw as `0x${string}`[]) || [];
  const benVaults   = (benVaultsRaw   as `0x${string}`[]) || [];

  const hasVault        = ownerVaults.length > 0;
  const isBeneficiary   = benVaults.length > 0;
  const vaultAddress    = hasVault ? ownerVaults[0] : null;
  const benVaultAddress = isBeneficiary ? benVaults[0] : null;

  const handleVaultCreated = useCallback(() => {
    setTimeout(() => refetchOwner(), 2500);
  }, [refetchOwner]);

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.4rem', color: 'var(--text-1)', marginBottom: '0.5rem' }}>Chronos Vault</div>
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'center', maxWidth: '340px' }}>
          Connect your wallet to access your vault dashboard or claim an inheritance.
        </p>
        <ConnectButton />
        <a href="/" style={{ marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--text-4)', textDecoration: 'none' }}>Back to home</a>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top nav — matches landing page style */}
      <header style={{
        height: '60px',
        flexShrink: 0,
        background: 'rgba(240, 235, 227, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        zIndex: 40,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-serif), DM Serif Display, serif', fontSize: '1.1rem', color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Chronos Vault
          </span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="/#how"   style={{ fontSize: '0.85rem', color: 'var(--text-3)', textDecoration: 'none' }}>How it works</a>
          <a href="/#why"   style={{ fontSize: '0.85rem', color: 'var(--text-3)', textDecoration: 'none' }}>Why</a>
          <a href="https://github.com/timburman/Chronos-Vault" target="_blank" rel="noopener noreferrer"
             style={{ fontSize: '0.85rem', color: 'var(--text-3)', textDecoration: 'none' }}>GitHub</a>
          <ConnectButton showBalance={false} accountStatus="address" chainStatus="none" />
        </nav>
      </header>

      {/* Body — fills remaining height exactly */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar
          active={section}
          onChange={setSection}
          isOwner={hasVault}
          isBeneficiary={isBeneficiary}
        />

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 3rem' }}>
          {/* No vault yet — show create form (both new users and beneficiary-only users) */}
          {!hasVault && section !== 'claim' && (
            <CreateVaultModal onSuccess={handleVaultCreated} />
          )}

          {/* Owner sections */}
          {hasVault && (
            <>
              {section === 'overview'  && <Overview  vaultAddress={vaultAddress!} />}
              {section === 'assets'    && <Assets    vaultAddress={vaultAddress!} />}
              {section === 'deposit'   && <Deposit   vaultAddress={vaultAddress!} />}
              {section === 'withdraw'  && <Withdraw  vaultAddress={vaultAddress!} />}
              {section === 'settings'  && <Settings  vaultAddress={vaultAddress!} />}
              {section === 'claim'     && benVaultAddress && <Claim vaultAddress={benVaultAddress} />}
            </>
          )}

          {/* Beneficiary only */}
          {!hasVault && isBeneficiary && section === 'claim' && (
            <Claim vaultAddress={benVaultAddress!} />
          )}
        </main>
      </div>
    </div>
  );
}
