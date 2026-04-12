'use client';

import { useReadContract } from 'wagmi';
import { VaultABI, ERC20ABI } from '@/utils/abi';
import { formatEther, formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';
import { autoDetectTokens, fetchNFTs, isAlchemyAvailable } from '@/utils/alchemy';
import type { AlchemyNFT } from '@/utils/alchemy';

interface Props { vaultAddress: `0x${string}` }

// ─── Token Row Component ────────────────────────────────────────────────────

function TokenRow({
  vaultAddress,
  tokenAddress,
  logo,
  onRemove,
}: {
  vaultAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  logo?: string | null;
  onRemove: () => void;
}) {
  const { data: bal }      = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'balanceOf', args: [vaultAddress] });
  const { data: symbol }   = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'symbol' });
  const { data: decimals } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'decimals' });
  const { data: name }     = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'name' });

  const fmt = bal && decimals ? parseFloat(formatUnits(bal as bigint, decimals as number)) : null;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.875rem 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {logo && (
          <img src={logo} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-1)' }}>
            {(name as string) || '…'}
            <span style={{ color: 'var(--text-4)', fontWeight: 400, marginLeft: '0.375rem' }}>
              {(symbol as string) || ''}
            </span>
          </div>
          <code style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>
            {tokenAddress.slice(0, 12)}…{tokenAddress.slice(-6)}
          </code>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: fmt === 0 ? 'var(--text-4)' : 'var(--text-1)', fontSize: '0.95rem' }}>
            {fmt !== null ? fmt.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '…'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{(symbol as string) || ''}</div>
        </div>
        <button
          onClick={onRemove}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-4)', fontSize: '0.75rem', padding: '0.25rem 0.5rem',
            borderRadius: '4px', transition: 'color 0.12s',
          }}
          title="Remove from list"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── NFT Card Component ────────────────────────────────────────────────────

function NFTCard({ nft }: { nft: AlchemyNFT }) {
  const imageUrl = nft.image?.thumbnailUrl || nft.image?.cachedUrl || nft.image?.originalUrl;
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      overflow: 'hidden',
      transition: 'transform 0.12s, box-shadow 0.12s',
    }}>
      <div style={{
        width: '100%', aspectRatio: '1', background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt={nft.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '2rem' }}>🖼️</span>
        )}
      </div>
      <div style={{ padding: '0.75rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {nft.name || `#${nft.tokenId}`}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', marginTop: '0.15rem' }}>
          {nft.contract.name || nft.contract.address.slice(0, 8)}…
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
          <span className="pill-accent" style={{ fontSize: '0.62rem' }}>{nft.tokenType}</span>
          {nft.balance && Number(nft.balance) > 1 && (
            <span className="pill-success" style={{ fontSize: '0.62rem' }}>×{nft.balance}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Assets({ vaultAddress }: Props) {
  const [ethPrice, setEthPrice] = useState(0);
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState('');
  const [nfts, setNfts] = useState<AlchemyNFT[]>([]);
  const [nftsLoading, setNftsLoading] = useState(false);

  const [trackedTokens, setTrackedTokens] = useState<{ address: `0x${string}`; logo?: string | null }[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`cv_tokens_v2_${vaultAddress}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => { fetchETHPrice().then(setEthPrice); }, []);

  const { data: balance, refetch } = useReadContract({
    address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance',
  });

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const usdBal = (parseFloat(ethBal) * ethPrice).toFixed(2);

  // Persist tracked tokens
  const updateTracked = (updated: { address: `0x${string}`; logo?: string | null }[]) => {
    setTrackedTokens(updated);
    try { localStorage.setItem(`cv_tokens_v2_${vaultAddress}`, JSON.stringify(updated)); } catch {}
  };

  const addToken = () => {
    setError('');
    const addr = tokenInput.trim() as `0x${string}`;
    if (!addr.startsWith('0x') || addr.length !== 42) {
      setError('Enter a valid 0x… contract address (42 chars).');
      return;
    }
    if (trackedTokens.some((t) => t.address.toLowerCase() === addr.toLowerCase())) {
      setError('Token already tracked.');
      return;
    }
    updateTracked([...trackedTokens, { address: addr }]);
    setTokenInput('');
  };

  const removeToken = (addr: `0x${string}`) => {
    updateTracked(trackedTokens.filter((t) => t.address !== addr));
  };

  // Alchemy auto-detect
  const handleAutoDetect = async () => {
    setDetecting(true);
    setDetectMsg('');
    try {
      const detected = await autoDetectTokens(vaultAddress);
      const existingSet = new Set(trackedTokens.map((t) => t.address.toLowerCase()));
      const newTokens = detected.filter((d) => !existingSet.has(d.address.toLowerCase()));

      if (newTokens.length > 0) {
        const merged = [
          ...trackedTokens,
          ...newTokens.map((t) => ({ address: t.address, logo: t.logo })),
        ];
        updateTracked(merged);
        setDetectMsg(`Found ${newTokens.length} new token${newTokens.length > 1 ? 's' : ''}!`);
      } else {
        setDetectMsg('No new tokens found.');
      }
    } catch {
      setDetectMsg('Auto-detect failed. Check your Alchemy API key.');
    }
    setDetecting(false);
  };

  // NFT fetch
  const loadNFTs = async () => {
    setNftsLoading(true);
    try {
      const result = await fetchNFTs(vaultAddress);
      setNfts(result);
    } catch {
      setNfts([]);
    }
    setNftsLoading(false);
  };

  useEffect(() => {
    if (isAlchemyAvailable()) loadNFTs();
  }, [vaultAddress]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)' }}>Assets</h1>

      {/* ETH */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div className="label">Native ETH</div>
          <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }} onClick={() => refetch()}>
            Refresh
          </button>
        </div>
        <div style={{ fontFamily: 'var(--font-serif), serif', fontSize: '2rem', color: 'var(--text-1)' }}>
          {parseFloat(ethBal).toFixed(6)} <span style={{ fontSize: '1rem', color: 'var(--text-4)' }}>ETH</span>
        </div>
        <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          ≈ ${usdBal} USD {ethPrice === 0 && <span style={{ color: 'var(--text-4)' }}>(price unavailable on testnet)</span>}
        </div>
      </div>

      {/* ERC-20 Tokens */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div className="label" style={{ margin: 0 }}>ERC-20 Tokens</div>
          {isAlchemyAvailable() && (
            <button
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              onClick={handleAutoDetect}
              disabled={detecting}
            >
              {detecting ? 'Scanning…' : '✨ Auto-Detect'}
            </button>
          )}
        </div>

        {detectMsg && (
          <div style={{
            fontSize: '0.78rem', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem',
            background: detectMsg.includes('Found') ? 'var(--success-bg)' : 'var(--surface-2)',
            color: detectMsg.includes('Found') ? 'var(--success)' : 'var(--text-3)',
          }}>
            {detectMsg}
          </div>
        )}

        <p style={{ fontSize: '0.82rem', color: 'var(--text-4)', marginBottom: '1rem', lineHeight: 1.6 }}>
          {isAlchemyAvailable()
            ? 'Click "Auto-Detect" to scan for tokens, or manually paste a contract address below.'
            : 'Paste a token\'s contract address to check its balance. Set NEXT_PUBLIC_ALCHEMY_KEY for auto-detection.'}
        </p>

        {trackedTokens.length === 0 ? (
          <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.85rem', borderTop: '1px solid var(--border)' }}>
            No tokens tracked yet.
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {trackedTokens.map((t) => (
              <TokenRow key={t.address} vaultAddress={vaultAddress} tokenAddress={t.address} logo={t.logo} onRemove={() => removeToken(t.address)} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <input
            className="input-field"
            placeholder="Token contract address (0x…)"
            value={tokenInput}
            onChange={(e) => { setTokenInput(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && addToken()}
            style={{ fontFamily: 'monospace', flex: 1 }}
          />
          <button className="btn-secondary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }} onClick={addToken}>
            Track Token
          </button>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.5rem' }}>{error}</p>}
      </div>

      {/* NFT Gallery */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div className="label" style={{ margin: 0 }}>NFT Collection</div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            onClick={loadNFTs}
            disabled={nftsLoading || !isAlchemyAvailable()}
          >
            {nftsLoading ? 'Loading…' : 'Refresh NFTs'}
          </button>
        </div>

        {!isAlchemyAvailable() ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-4)', lineHeight: 1.6 }}>
            Set NEXT_PUBLIC_ALCHEMY_KEY in your .env to view NFTs held by this vault.
          </p>
        ) : nfts.length === 0 ? (
          <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.85rem', borderTop: '1px solid var(--border)' }}>
            {nftsLoading ? 'Scanning vault for NFTs…' : 'No NFTs found in this vault.'}
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem',
          }}>
            {nfts.map((nft, i) => (
              <NFTCard key={`${nft.contract.address}-${nft.tokenId}-${i}`} nft={nft} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
