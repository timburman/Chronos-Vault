'use client';

import { useWriteContract, useReadContract } from 'wagmi';
import { VaultABI, ERC20ABI, ERC721ABI } from '@/utils/abi';
import { formatEther, parseEther, parseUnits, formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Props { vaultAddress: `0x${string}` }
type WithdrawTab = 'eth' | 'erc20' | 'nft';

interface TrackedToken { address: `0x${string}`; logo?: string | null; }

export default function Withdraw({ vaultAddress }: Props) {
  const [tab, setTab] = useState<WithdrawTab>('eth');

  // ETH
  const [ethAmount, setEthAmount] = useState('');
  const { data: balance, refetch } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance' });
  const ethBal = balance ? parseFloat(formatEther(balance as bigint)) : 0;

  // ERC-20
  const [selectedToken, setSelectedToken] = useState<`0x${string}` | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTokenAddr, setCustomTokenAddr] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');

  const activeTokenAddr = selectedToken || (customTokenAddr.length === 42 ? customTokenAddr as `0x${string}` : undefined);
  const { data: tokenSymbol } = useReadContract({ address: activeTokenAddr, abi: ERC20ABI, functionName: 'symbol', query: { enabled: !!activeTokenAddr } });
  const { data: tokenName } = useReadContract({ address: activeTokenAddr, abi: ERC20ABI, functionName: 'name', query: { enabled: !!activeTokenAddr } });
  const { data: tokenDecimals } = useReadContract({ address: activeTokenAddr, abi: ERC20ABI, functionName: 'decimals', query: { enabled: !!activeTokenAddr } });
  const { data: vaultTokenBal } = useReadContract({ address: activeTokenAddr, abi: ERC20ABI, functionName: 'balanceOf', args: [vaultAddress], query: { enabled: !!activeTokenAddr } });

  // NFT
  const [nftAddress, setNftAddress] = useState('');
  const [nftTokenId, setNftTokenId] = useState('');
  const [nftType, setNftType] = useState<'erc721' | 'erc1155'>('erc721');
  const [nftAmount, setNftAmount] = useState('1');
  const { data: nftName } = useReadContract({ address: nftAddress.length === 42 ? nftAddress as `0x${string}` : undefined, abi: ERC721ABI, functionName: 'name', query: { enabled: nftAddress.length === 42 } });

  // Tracked tokens
  const [trackedTokens, setTrackedTokens] = useState<TrackedToken[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { const saved = localStorage.getItem(`cv_tokens_v2_${vaultAddress}`); if (saved) setTrackedTokens(JSON.parse(saved)); } catch {}
  }, [vaultAddress]);

  const { writeContractAsync } = useWriteContract();
  const decimals = tokenDecimals !== undefined ? Number(tokenDecimals) : 18;
  const vaultTokenFormatted = vaultTokenBal ? parseFloat(formatUnits(vaultTokenBal as bigint, decimals)) : null;

  const handleWithdrawETH = async () => {
    const tid = toast.loading('Withdrawing ETH...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'withdraw', args: [parseEther(ethAmount)] });
      toast.success(`${ethAmount} ETH withdrawn`, { id: tid });
      setEthAmount(''); setTimeout(refetch, 2500);
    } catch { toast.error('Withdrawal failed', { id: tid }); }
  };

  const handleWithdrawERC20 = async () => {
    if (!activeTokenAddr || !tokenAmount) return;
    const tid = toast.loading('Withdrawing token...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'withdrawERC20', args: [activeTokenAddr, parseUnits(tokenAmount, decimals)] });
      toast.success(`${tokenAmount} ${tokenSymbol || 'tokens'} withdrawn`, { id: tid });
      setTokenAmount('');
    } catch { toast.error('Withdrawal failed', { id: tid }); }
  };

  const handleWithdrawNFT = async () => {
    if (!nftAddress || !nftTokenId) return;
    const addr = nftAddress.trim() as `0x${string}`;
    const tokenId = BigInt(nftTokenId);
    const tid = toast.loading('Withdrawing NFT...');
    try {
      if (nftType === 'erc721') {
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'withdrawERC721', args: [addr, tokenId] });
      } else {
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'withdrawERC1155', args: [addr, tokenId, BigInt(nftAmount)] });
      }
      toast.success('NFT withdrawn', { id: tid });
      setNftTokenId('');
    } catch { toast.error('Withdrawal failed', { id: tid }); }
  };

  const tabs: { id: WithdrawTab; label: string }[] = [{ id: 'eth', label: 'ETH' }, { id: 'erc20', label: 'Token' }, { id: 'nft', label: 'NFT' }];

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Withdraw</h1>

      <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--surface)', borderRadius: '8px', padding: '0.2rem' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '0.45rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.12s',
            background: tab === t.id ? 'var(--bg)' : 'transparent', color: tab === t.id ? 'var(--text-1)' : 'var(--text-3)',
            boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'eth' && (
        <div className="card">
          <div className="label">Withdraw ETH</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Vault balance</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-1)' }}>{ethBal.toFixed(4)} ETH</span>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem' }}>
            {[{ l: '25%', p: 0.25 }, { l: '50%', p: 0.5 }, { l: '75%', p: 0.75 }, { l: 'Max', p: 1 }].map(({ l, p }) => (
              <button key={l} onClick={() => setEthAmount((ethBal * p).toFixed(6))} style={{
                flex: 1, padding: '0.35rem', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s',
                border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-3)',
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Amount (ETH)</label>
              <input className="input-field" type="number" min="0" step="any" placeholder="0.00" value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} />
            </div>
            <button className="btn-primary" disabled={!ethAmount || ethBal === 0} onClick={handleWithdrawETH} style={{ flexShrink: 0 }}>Withdraw</button>
          </div>
        </div>
      )}

      {tab === 'erc20' && (
        <div className="card">
          <div className="label">Select Token</div>
          {trackedTokens.length > 0 && !showCustomInput ? (
            <>
              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {trackedTokens.map((t) => (
                  <VaultTokenRow key={t.address} tokenAddress={t.address} vaultAddress={vaultAddress} selected={selectedToken === t.address} onSelect={() => { setSelectedToken(t.address); setShowCustomInput(false); setCustomTokenAddr(''); }} />
                ))}
              </div>
              <button onClick={() => { setShowCustomInput(true); setSelectedToken(null); }} className="btn-ghost" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>+ Enter custom address</button>
            </>
          ) : (
            <>
              <input className="input-field" placeholder="Token contract address (0x...)" value={customTokenAddr} onChange={(e) => { setCustomTokenAddr(e.target.value); setSelectedToken(null); }} style={{ fontFamily: 'monospace', marginTop: '0.5rem' }} />
              {tokenName && <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>Detected: {tokenName as string} ({tokenSymbol as string})</div>}
              {trackedTokens.length > 0 && <button onClick={() => { setShowCustomInput(false); setCustomTokenAddr(''); }} className="btn-ghost" style={{ marginTop: '0.35rem' }}>Back to tracked tokens</button>}
            </>
          )}
          {activeTokenAddr && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Vault holds</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>{vaultTokenFormatted !== null ? vaultTokenFormatted.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '...'} {tokenSymbol as string || ''}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><label className="label">Amount</label><input className="input-field" type="number" min="0" placeholder="0" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} /></div>
                <button onClick={() => vaultTokenFormatted !== null && setTokenAmount(vaultTokenFormatted.toFixed(6))} className="btn-ghost" style={{ paddingBottom: '0.55rem' }}>Max</button>
                <button className="btn-primary" disabled={!tokenAmount} onClick={handleWithdrawERC20} style={{ flexShrink: 0 }}>Withdraw</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'nft' && (
        <div className="card">
          <div className="label">Withdraw NFT</div>
          <div style={{ display: 'flex', gap: '0.375rem', margin: '0.5rem 0' }}>
            {(['erc721', 'erc1155'] as const).map((t) => (
              <button key={t} onClick={() => setNftType(t)} style={{
                flex: 1, padding: '0.4rem', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s',
                border: `1px solid ${nftType === t ? 'var(--accent)' : 'var(--border)'}`, background: nftType === t ? 'var(--accent-bg)' : 'var(--bg)', color: nftType === t ? 'var(--accent)' : 'var(--text-3)',
              }}>{t === 'erc721' ? 'ERC-721' : 'ERC-1155'}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.5rem' }}>
            <div><label className="label">NFT Contract</label><input className="input-field" placeholder="0x..." value={nftAddress} onChange={(e) => setNftAddress(e.target.value)} style={{ fontFamily: 'monospace' }} />{nftName && <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.2rem' }}>Collection: {nftName as string}</div>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: nftType === 'erc1155' ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
              <div><label className="label">Token ID</label><input className="input-field" type="number" min="0" placeholder="0" value={nftTokenId} onChange={(e) => setNftTokenId(e.target.value)} /></div>
              {nftType === 'erc1155' && <div><label className="label">Amount</label><input className="input-field" type="number" min="1" placeholder="1" value={nftAmount} onChange={(e) => setNftAmount(e.target.value)} /></div>}
            </div>
            <button className="btn-primary" disabled={!nftAddress || !nftTokenId} onClick={handleWithdrawNFT}>Withdraw NFT</button>
          </div>
        </div>
      )}
    </div>
  );
}

function VaultTokenRow({ tokenAddress, vaultAddress, selected, onSelect }: { tokenAddress: `0x${string}`; vaultAddress: `0x${string}`; selected: boolean; onSelect: () => void }) {
  const { data: symbol } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'symbol' });
  const { data: name } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'name' });
  const { data: decimals } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'decimals' });
  const { data: bal } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'balanceOf', args: [vaultAddress] });
  const fmt = bal && decimals ? parseFloat(formatUnits(bal as bigint, decimals as number)) : null;
  return (
    <div className={`token-row ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div><div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-1)' }}>{(name as string) || '...'}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-4)', fontFamily: 'monospace' }}>{tokenAddress.slice(0, 10)}...{tokenAddress.slice(-4)}</div></div>
      <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 600, fontSize: '0.85rem', color: fmt === 0 ? 'var(--text-4)' : 'var(--text-1)' }}>{fmt !== null ? fmt.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '...'}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{(symbol as string) || ''}</div></div>
    </div>
  );
}
