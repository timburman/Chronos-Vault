'use client';

import { useReadContract, useBalance } from 'wagmi';
import { useAccount } from 'wagmi';
import { VaultABI, ERC20ABI } from '@/utils/abi';
import { formatEther, formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';

interface Props { vaultAddress: `0x${string}` }

// Common ERC-20 tokens — extends with tracked ones added by user
// For local Anvil we rely on user-added tokens; these are mainnet references shown as examples
const KNOWN_TOKENS: { symbol: string; address: `0x${string}`; decimals: number }[] = [
  // Uncomment and fill your testnet deployed tokens here
  // { symbol: 'USDC', address: '0x...', decimals: 6 },
];

interface TokenData {
  address: `0x${string}`;
  symbol?: string;
  name?: string;
  decimals?: number;
  balance?: bigint;
}

function TokenRow({
  vaultAddress,
  tokenAddress,
  onRemove,
}: {
  vaultAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
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

export default function Assets({ vaultAddress }: Props) {
  const [ethPrice, setEthPrice] = useState(0);
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [trackedTokens, setTrackedTokens] = useState<`0x${string}`[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`cv_tokens_${vaultAddress}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => { fetchETHPrice().then(setEthPrice); }, []);

  const { data: balance, refetch } = useReadContract({
    address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance',
  });

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const usdBal = (parseFloat(ethBal) * ethPrice).toFixed(2);

  const addToken = () => {
    setError('');
    const addr = tokenInput.trim() as `0x${string}`;
    if (!addr.startsWith('0x') || addr.length !== 42) {
      setError('Enter a valid 0x… contract address (42 chars).');
      return;
    }
    if (trackedTokens.includes(addr)) {
      setError('Token already tracked.');
      return;
    }
    const updated = [...trackedTokens, addr];
    setTrackedTokens(updated);
    try { localStorage.setItem(`cv_tokens_${vaultAddress}`, JSON.stringify(updated)); } catch {}
    setTokenInput('');
  };

  const removeToken = (addr: `0x${string}`) => {
    const updated = trackedTokens.filter((t) => t !== addr);
    setTrackedTokens(updated);
    try { localStorage.setItem(`cv_tokens_${vaultAddress}`, JSON.stringify(updated)); } catch {}
  };

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

      {/* Tracked ERC20 Tokens */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.5rem' }}>ERC-20 Tokens</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-4)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Paste a token's contract address to check its balance inside the vault. Token info and balance load automatically.
          Tracked tokens persist per vault.
        </p>

        {trackedTokens.length === 0 ? (
          <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.85rem', borderTop: '1px solid var(--border)' }}>
            No tokens tracked yet.
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {trackedTokens.map((addr) => (
              <TokenRow key={addr} vaultAddress={vaultAddress} tokenAddress={addr} onRemove={() => removeToken(addr)} />
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
    </div>
  );
}
