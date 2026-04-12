'use client';

import { useReadContract } from 'wagmi';
import { VaultABI, ERC20ABI } from '@/utils/abi';
import { formatEther, formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';
import { autoDetectTokens, fetchNFTs, isAlchemyAvailable } from '@/utils/alchemy';
import type { AlchemyNFT } from '@/utils/alchemy';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { vaultAddress: `0x${string}` }

function TokenRow({ vaultAddress, tokenAddress, onRemove }: {
  vaultAddress: `0x${string}`; tokenAddress: `0x${string}`; onRemove: () => void;
}) {
  const { data: bal } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'balanceOf', args: [vaultAddress] });
  const { data: symbol } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'symbol' });
  const { data: decimals } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'decimals' });
  const { data: name } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'name' });
  const fmt = bal && decimals ? parseFloat(formatUnits(bal as bigint, decimals as number)) : null;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-1)' }}>
          {(name as string) || '...'} <span style={{ color: 'var(--text-4)', fontWeight: 400, marginLeft: '0.25rem' }}>{(symbol as string) || ''}</span>
        </div>
        <code style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{tokenAddress.slice(0, 10)}...{tokenAddress.slice(-4)}</code>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: fmt === 0 ? 'var(--text-4)' : 'var(--text-1)', fontSize: '0.88rem' }}>{fmt !== null ? fmt.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '...'}</div>
        </div>
        <button onClick={onRemove} className="btn-ghost" title="Remove"><X size={13} /></button>
      </div>
    </div>
  );
}

function NFTCard({ nft }: { nft: AlchemyNFT }) {
  const imageUrl = nft.image?.thumbnailUrl || nft.image?.cachedUrl || nft.image?.originalUrl;
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ width: '100%', aspectRatio: '1', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {imageUrl ? <img src={imageUrl} alt={nft.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem', color: 'var(--text-4)' }}>NFT</span>}
      </div>
      <div style={{ padding: '0.625rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nft.name || `#${nft.tokenId}`}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', marginTop: '0.1rem' }}>{nft.contract.name || nft.contract.address.slice(0, 8)}...</div>
        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.35rem' }}>
          <span className="pill-accent" style={{ fontSize: '0.6rem' }}>{nft.tokenType}</span>
          {nft.balance && Number(nft.balance) > 1 && <span className="pill-success" style={{ fontSize: '0.6rem' }}>x{nft.balance}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Assets({ vaultAddress }: Props) {
  const [ethPrice, setEthPrice] = useState(0);
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [nfts, setNfts] = useState<AlchemyNFT[]>([]);
  const [nftsLoading, setNftsLoading] = useState(false);

  const [trackedTokens, setTrackedTokens] = useState<{ address: `0x${string}`; logo?: string | null }[]>(() => {
    if (typeof window === 'undefined') return [];
    try { const saved = localStorage.getItem(`cv_tokens_v2_${vaultAddress}`); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  useEffect(() => { fetchETHPrice().then(setEthPrice); }, []);
  const { data: balance, refetch } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance' });
  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const usdBal = (parseFloat(ethBal) * ethPrice).toFixed(2);

  const updateTracked = (updated: { address: `0x${string}`; logo?: string | null }[]) => {
    setTrackedTokens(updated);
    try { localStorage.setItem(`cv_tokens_v2_${vaultAddress}`, JSON.stringify(updated)); } catch {}
  };

  const addToken = () => {
    setError('');
    const addr = tokenInput.trim() as `0x${string}`;
    if (!addr.startsWith('0x') || addr.length !== 42) { setError('Invalid address.'); return; }
    if (trackedTokens.some((t) => t.address.toLowerCase() === addr.toLowerCase())) { setError('Already tracked.'); return; }
    updateTracked([...trackedTokens, { address: addr }]);
    setTokenInput('');
    toast.success('Token added to tracking');
  };

  const removeToken = (addr: `0x${string}`) => { updateTracked(trackedTokens.filter((t) => t.address !== addr)); };

  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      const detected = await autoDetectTokens(vaultAddress);
      const existing = new Set(trackedTokens.map((t) => t.address.toLowerCase()));
      const newTokens = detected.filter((d) => !existing.has(d.address.toLowerCase()));
      if (newTokens.length > 0) {
        updateTracked([...trackedTokens, ...newTokens.map((t) => ({ address: t.address, logo: t.logo }))]);
        toast.success(`Found ${newTokens.length} new token${newTokens.length > 1 ? 's' : ''}`);
      } else { toast('No new tokens found'); }
    } catch { toast.error('Auto-detect failed'); }
    setDetecting(false);
  };

  const loadNFTs = async () => {
    setNftsLoading(true);
    try { setNfts(await fetchNFTs(vaultAddress)); } catch { setNfts([]); }
    setNftsLoading(false);
  };

  useEffect(() => { if (isAlchemyAvailable()) loadNFTs(); }, [vaultAddress]);

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Assets</h1>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="label">Native ETH</div>
          <button className="btn-ghost" onClick={() => refetch()}>Refresh</button>
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--text-1)' }}>{parseFloat(ethBal).toFixed(6)} <span style={{ fontSize: '0.88rem', color: 'var(--text-4)' }}>ETH</span></div>
        <div style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: '0.15rem' }}>~ ${usdBal} USD</div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div className="label" style={{ margin: 0 }}>ERC-20 Tokens</div>
          {isAlchemyAvailable() && (
            <button className="btn-ghost" onClick={handleAutoDetect} disabled={detecting}>{detecting ? 'Scanning...' : 'Auto-Detect'}</button>
          )}
        </div>
        {trackedTokens.length === 0 ? (
          <div style={{ padding: '1.25rem 0', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem', borderTop: '1px solid var(--border)' }}>No tokens tracked.</div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border)' }}>{trackedTokens.map((t) => <TokenRow key={t.address} vaultAddress={vaultAddress} tokenAddress={t.address} onRemove={() => removeToken(t.address)} />)}</div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <input className="input-field" placeholder="Token address (0x...)" value={tokenInput} onChange={(e) => { setTokenInput(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && addToken()} style={{ fontFamily: 'monospace', flex: 1 }} />
          <button className="btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={addToken}>Track</button>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
      </div>

      {isAlchemyAvailable() && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div className="label" style={{ margin: 0 }}>NFTs</div>
            <button className="btn-ghost" onClick={loadNFTs} disabled={nftsLoading}>{nftsLoading ? 'Loading...' : 'Refresh'}</button>
          </div>
          {nfts.length === 0 ? (
            <div style={{ padding: '1.25rem 0', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem', borderTop: '1px solid var(--border)' }}>{nftsLoading ? 'Scanning...' : 'No NFTs found.'}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              {nfts.map((nft, i) => <NFTCard key={`${nft.contract.address}-${nft.tokenId}-${i}`} nft={nft} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
