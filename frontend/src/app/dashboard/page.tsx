'use client';

import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useCallback } from 'react';
import { VaultFactoryABI, FACTORY_ADDRESS } from '@/utils/abi';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/dashboard/Sidebar';

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        height: '52px',
        background: 'var(--bg-alt)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 1.5rem',
        flexShrink: 0,
      }}>
        <ConnectButton showBalance={false} accountStatus="address" chainStatus="none" />
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar
          active={section}
          onChange={setSection}
          isOwner={hasVault}
          isBeneficiary={isBeneficiary}
        />

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 3rem' }}>
          {/* No vault yet */}
          {!hasVault && !isBeneficiary && (
            <CreateVaultModal onSuccess={handleVaultCreated} />
          )}

          {!hasVault && isBeneficiary && section !== 'claim' && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'var(--accent-bg)', border: '1px solid var(--border-2)', borderRadius: '8px', fontSize: '0.87rem', color: 'var(--accent)' }}>
              You are designated as a beneficiary. Navigate to <strong>Claim Inheritance</strong> in the sidebar.
            </div>
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
