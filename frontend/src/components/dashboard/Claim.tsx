'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI, ERC20ABI } from '@/utils/abi';
import { formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';
import { autoDetectTokens, fetchNFTs, isAlchemyAvailable } from '@/utils/alchemy';
import type { AlchemyNFT } from '@/utils/alchemy';
import { motion } from 'framer-motion';

interface Props { vaultAddress: `0x${string}` }

interface DetectedToken {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
}

export default function Claim({ vaultAddress }: Props) {
  const [ethPrice, setEthPrice] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [claimingAll, setClaimingAll] = useState(false);
  const [claimProgress, setClaimProgress] = useState('');
  const [claimDone, setClaimDone] = useState(false);
  const [tokens, setTokens] = useState<DetectedToken[]>([]);
  const [nfts, setNfts] = useState<AlchemyNFT[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    fetchETHPrice().then(setEthPrice);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load all claimable assets
  useEffect(() => {
    if (!isAlchemyAvailable()) return;
    setLoadingAssets(true);
    Promise.all([
      autoDetectTokens(vaultAddress).then((detected) =>
        detected.map((d) => ({ address: d.address, symbol: d.symbol, name: d.name, decimals: d.decimals }))
      ),
      fetchNFTs(vaultAddress),
    ]).then(([t, n]) => {
      setTokens(t);
      setNfts(n);
      setLoadingAssets(false);
    }).catch(() => setLoadingAssets(false));
  }, [vaultAddress]);

  const { data: balance, refetch }  = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance' });
  const { data: lastPing }          = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'lastPingTime' });
  const { data: timeout }           = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: owner }             = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'owner' });
  const { writeContractAsync, isPending } = useWriteContract();

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const usdBal = (parseFloat(ethBal) * ethPrice).toFixed(2);

  let isUnlocked = false;
  let d = 0, h = 0, m = 0, s = 0;
  if (lastPing && timeout) {
    const unlockMs  = (Number(lastPing) + Number(timeout)) * 1000;
    const remaining = Math.max(0, unlockMs - now);
    isUnlocked = remaining === 0;
    d = Math.floor(remaining / 86400000);
    h = Math.floor((remaining % 86400000) / 3600000);
    m = Math.floor((remaining % 3600000) / 60000);
    s = Math.floor((remaining % 60000) / 1000);
  }

  // Claim all assets sequentially
  const handleClaimAll = async () => {
    setClaimingAll(true);
    setClaimDone(false);
    let step = 1;
    const totalSteps = 1 + tokens.length + nfts.length;

    try {
      // 1. Claim ETH
      if (parseFloat(ethBal) > 0) {
        setClaimProgress(`Step ${step}/${totalSteps}: Claiming ETH…`);
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'claimFunds' });
        step++;
      }

      // 2. Claim each ERC-20
      for (const token of tokens) {
        setClaimProgress(`Step ${step}/${totalSteps}: Claiming ${token.symbol}…`);
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'claimERC20', args: [token.address] });
        step++;
      }

      // 3. Claim each NFT
      for (const nft of nfts) {
        const label = nft.name || `#${nft.tokenId}`;
        setClaimProgress(`Step ${step}/${totalSteps}: Claiming ${label}…`);
        if (nft.tokenType === 'ERC721') {
          await writeContractAsync({
            address: vaultAddress, abi: VaultABI, functionName: 'claimERC721',
            args: [nft.contract.address as `0x${string}`, BigInt(nft.tokenId)],
          });
        } else {
          const amount = BigInt(nft.balance || '1');
          await writeContractAsync({
            address: vaultAddress, abi: VaultABI, functionName: 'claimERC1155',
            args: [nft.contract.address as `0x${string}`, BigInt(nft.tokenId), amount],
          });
        }
        step++;
      }

      setClaimDone(true);
      setTimeout(refetch, 2500);
    } catch {
      setClaimProgress('Transaction failed. You can try again.');
    }
    setClaimingAll(false);
  };

  const handleClaimETH = async () => {
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'claimFunds' });
      setTimeout(refetch, 2500);
    } catch {}
  };

  const totalAssets = 1 + tokens.length + nfts.length; // ETH + tokens + NFTs

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)' }}>Claim Inheritance</h1>

      {/* Inheritance Manifest */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.75rem' }}>Inheritance Manifest</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          {/* ETH */}
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '0.25rem' }}>ETH</div>
            <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.5rem', color: 'var(--text-1)' }}>
              {parseFloat(ethBal).toFixed(4)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>${usdBal}</div>
          </div>

          {/* ERC-20 count */}
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '0.25rem' }}>ERC-20 Tokens</div>
            <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.5rem', color: 'var(--text-1)' }}>
              {loadingAssets ? '…' : tokens.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
              {tokens.map((t) => t.symbol).join(', ') || 'none detected'}
            </div>
          </div>

          {/* NFT count */}
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '0.25rem' }}>NFTs</div>
            <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.5rem', color: 'var(--text-1)' }}>
              {loadingAssets ? '…' : nfts.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
              {nfts.length > 0 ? `${nfts.filter((n) => n.tokenType === 'ERC721').length} ERC-721, ${nfts.filter((n) => n.tokenType === 'ERC1155').length} ERC-1155` : 'none detected'}
            </div>
          </div>
        </div>

        {/* Individual token list */}
        {tokens.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="label" style={{ marginBottom: '0.5rem' }}>Token Breakdown</div>
            {tokens.map((t) => (
              <div key={t.address} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-2)' }}>{t.name} ({t.symbol})</span>
                <code style={{ color: 'var(--text-4)', fontSize: '0.72rem' }}>{t.address.slice(0, 10)}…</code>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vault owner */}
      <div className="card-sm">
        <div className="label" style={{ margin: 0, marginBottom: '0.25rem' }}>Vault Owner</div>
        <code style={{ fontSize: '0.82rem', color: 'var(--text-2)', wordBreak: 'break-all' }}>{(owner as string) || '—'}</code>
      </div>

      {/* Status + Countdown / Claim */}
      <div className="card">
        {isUnlocked ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div className="label">Status</div>
                <span className="pill-success" style={{ marginTop: '0.5rem' }}>Vault Unlocked</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              The inactivity timeout has elapsed. You are authorized to claim all assets.
              {totalAssets > 1 && ` (${totalAssets} asset types detected — will process sequentially)`}
            </p>

            {claimDone ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.4rem', color: 'var(--success)', marginBottom: '0.375rem' }}>
                  Inheritance Claimed
                </div>
                <div style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>All assets have been transferred to your wallet.</div>
              </div>
            ) : (
              <>
                {claimProgress && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent)', marginBottom: '1rem', padding: '0.625rem 0.875rem', background: 'var(--accent-bg)', borderRadius: '6px' }}>
                    {claimProgress}
                  </div>
                )}

                {/* Claim Everything button */}
                {(tokens.length > 0 || nfts.length > 0) && (
                  <button
                    className="btn-accent"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.875rem', marginBottom: '0.75rem' }}
                    disabled={claimingAll || parseFloat(ethBal) === 0}
                    onClick={handleClaimAll}
                  >
                    {claimingAll ? 'Processing…' : `Claim Everything (${totalAssets} assets)`}
                  </button>
                )}

                {/* Claim ETH only */}
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.875rem' }}
                  disabled={isPending || parseFloat(ethBal) === 0 || claimingAll}
                  onClick={handleClaimETH}
                >
                  {isPending ? 'Processing…' : 'Claim ETH Only'}
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div className="label">Status</div>
                <span className="pill-danger" style={{ marginTop: '0.5rem' }}>Vault Locked</span>
              </div>
            </div>
            <div className="label" style={{ marginBottom: '0.75rem' }}>Time remaining</div>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              {[[d, 'Days'], [h, 'Hours'], [m, 'Min'], [s, 'Sec']].map(([val, unit]) => (
                <div key={String(unit)} style={{ textAlign: 'center' }}>
                  <div className="countdown-digit">{String(val).padStart(2, '0')}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{unit}</div>
                </div>
              ))}
            </div>
            <button className="btn-secondary" disabled style={{ width: '100%', justifyContent: 'center', opacity: 0.45, cursor: 'not-allowed' }}>
              Claim Inheritance — Locked
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
