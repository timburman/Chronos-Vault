'use client';

import { useWriteContract, useReadContract, useAccount, useBalance } from 'wagmi';
import { VaultABI, ERC20ABI, ERC721ABI, ERC1155ABI } from '@/utils/abi';
import { parseEther, parseUnits, formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Props { vaultAddress: `0x${string}` }

type DepositTab = 'eth' | 'erc20' | 'nft';

interface TrackedToken {
  address: `0x${string}`;
  logo?: string | null;
}

export default function Deposit({ vaultAddress }: Props) {
  const { address: walletAddress } = useAccount();
  const [tab, setTab] = useState<DepositTab>('eth');

  // ETH
  const [ethAmount, setEthAmount] = useState('');
  const ethWalletBal = useBalance({ address: walletAddress });

  // ERC-20 — token selection
  const [selectedToken, setSelectedToken] = useState<`0x${string}` | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTokenAddr, setCustomTokenAddr] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');

  const activeTokenAddr = selectedToken || (customTokenAddr.length === 42 ? customTokenAddr as `0x${string}` : undefined);

  const { data: tokenSymbol } = useReadContract({ address: activeTokenAddr, abi: ERC20ABI, functionName: 'symbol', query: { enabled: !!activeTokenAddr } });
  const { data: tokenName }   = useReadContract({ address: activeTokenAddr, abi: ERC20ABI, functionName: 'name', query: { enabled: !!activeTokenAddr } });
  const { data: tokenDecimals } = useReadContract({ address: activeTokenAddr, abi: ERC20ABI, functionName: 'decimals', query: { enabled: !!activeTokenAddr } });
  const { data: walletTokenBal } = useReadContract({ address: activeTokenAddr, abi: ERC20ABI, functionName: 'balanceOf', args: walletAddress ? [walletAddress] : undefined, query: { enabled: !!activeTokenAddr && !!walletAddress } });

  // NFT
  const [nftAddress, setNftAddress] = useState('');
  const [nftTokenId, setNftTokenId] = useState('');
  const [nftType, setNftType] = useState<'erc721' | 'erc1155'>('erc721');
  const [nftAmount, setNftAmount] = useState('1');
  const { data: nftName } = useReadContract({ address: nftAddress.length === 42 ? nftAddress as `0x${string}` : undefined, abi: ERC721ABI, functionName: 'name', query: { enabled: nftAddress.length === 42 } });

  // Tracked tokens from localStorage
  const [trackedTokens, setTrackedTokens] = useState<TrackedToken[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(`cv_tokens_v2_${vaultAddress}`);
      if (saved) setTrackedTokens(JSON.parse(saved));
    } catch {}
  }, [vaultAddress]);

  const { writeContractAsync } = useWriteContract();

  const walletEth = ethWalletBal.data ? parseFloat(ethWalletBal.data.formatted) : 0;
  const decimals = tokenDecimals !== undefined ? Number(tokenDecimals) : 18;
  const walletTokenFormatted = walletTokenBal ? parseFloat(formatUnits(walletTokenBal as bigint, decimals)) : null;

  const handleDepositETH = async () => {
    if (!ethAmount) return;
    const tid = toast.loading('Depositing ETH...');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'depositETH', value: parseEther(ethAmount) });
      toast.success(`${ethAmount} ETH deposited`, { id: tid });
      setEthAmount('');
    } catch { toast.error('Deposit failed', { id: tid }); }
  };

  const handleDepositERC20 = async () => {
    if (!activeTokenAddr || !tokenAmount) return;
    const amount = parseUnits(tokenAmount, decimals);
    const tid = toast.loading('Approving token...');
    try {
      await writeContractAsync({ address: activeTokenAddr, abi: ERC20ABI, functionName: 'approve', args: [vaultAddress, amount] });
      toast.loading('Depositing token...', { id: tid });
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'depositERC20', args: [activeTokenAddr, amount] });
      toast.success(`${tokenAmount} ${tokenSymbol || 'tokens'} deposited`, { id: tid });
      setTokenAmount('');
    } catch { toast.error('Deposit failed', { id: tid }); }
  };

  const handleDepositNFT = async () => {
    if (!nftAddress || !nftTokenId) return;
    const addr = nftAddress.trim() as `0x${string}`;
    const tokenId = BigInt(nftTokenId);
    const tid = toast.loading('Approving NFT...');
    try {
      if (nftType === 'erc721') {
        await writeContractAsync({ address: addr, abi: ERC721ABI, functionName: 'approve', args: [vaultAddress, tokenId] });
        toast.loading('Depositing NFT...', { id: tid });
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'depositERC721', args: [addr, tokenId] });
      } else {
        await writeContractAsync({ address: addr, abi: ERC1155ABI, functionName: 'setApprovalForAll', args: [vaultAddress, true] });
        toast.loading('Depositing NFT...', { id: tid });
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'depositERC1155', args: [addr, tokenId, BigInt(nftAmount)] });
      }
      toast.success('NFT deposited', { id: tid });
      setNftTokenId('');
    } catch { toast.error('NFT deposit failed', { id: tid }); }
  };

  const tabs: { id: DepositTab; label: string }[] = [{ id: 'eth', label: 'ETH' }, { id: 'erc20', label: 'Token' }, { id: 'nft', label: 'NFT' }];

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Deposit</h1>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--surface)', borderRadius: '8px', padding: '0.2rem' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '0.45rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.12s',
            background: tab === t.id ? 'var(--bg)' : 'transparent', color: tab === t.id ? 'var(--text-1)' : 'var(--text-3)',
            boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ETH */}
      {tab === 'eth' && (
        <div className="card">
          <div className="label">Deposit ETH</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Wallet balance</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-1)' }}>{walletEth.toFixed(4)} ETH</span>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {['0.01', '0.1', '0.5', '1'].map((p) => (
              <button key={p} onClick={() => setEthAmount(p)} style={{
                padding: '0.35rem 0.75rem', borderRadius: '5px', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.12s',
                border: `1px solid ${ethAmount === p ? 'var(--accent)' : 'var(--border)'}`, background: ethAmount === p ? 'var(--accent-bg)' : 'var(--bg)',
                color: ethAmount === p ? 'var(--accent)' : 'var(--text-3)', fontWeight: ethAmount === p ? 600 : 400,
              }}>{p} ETH</button>
            ))}
            <button onClick={() => setEthAmount(walletEth.toFixed(6))} className="btn-ghost" style={{ fontSize: '0.75rem' }}>Max</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Amount (ETH)</label>
              <input className="input-field" type="number" min="0" step="any" placeholder="0.00" value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} />
            </div>
            <button className="btn-primary" disabled={!ethAmount} onClick={handleDepositETH} style={{ flexShrink: 0 }}>Deposit</button>
          </div>
        </div>
      )}

      {/* ERC-20 — Token selector */}
      {tab === 'erc20' && (
        <div className="card">
          <div className="label">Select Token</div>
          {trackedTokens.length > 0 && !showCustomInput ? (
            <>
              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {trackedTokens.map((t) => (
                  <TokenSelectRow key={t.address} tokenAddress={t.address} walletAddress={walletAddress!} selected={selectedToken === t.address} onSelect={() => { setSelectedToken(t.address); setShowCustomInput(false); setCustomTokenAddr(''); }} />
                ))}
              </div>
              <button onClick={() => { setShowCustomInput(true); setSelectedToken(null); }} className="btn-ghost" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                + Enter custom address
              </button>
            </>
          ) : (
            <>
              <div style={{ marginTop: '0.5rem' }}>
                <input className="input-field" placeholder="Token contract address (0x...)" value={customTokenAddr} onChange={(e) => { setCustomTokenAddr(e.target.value); setSelectedToken(null); }} style={{ fontFamily: 'monospace' }} />
                {tokenName && <div style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '0.3rem' }}>Detected: {tokenName as string} ({tokenSymbol as string})</div>}
              </div>
              {trackedTokens.length > 0 && (
                <button onClick={() => { setShowCustomInput(false); setCustomTokenAddr(''); }} className="btn-ghost" style={{ marginTop: '0.375rem' }}>
                  Back to tracked tokens
                </button>
              )}
            </>
          )}

          {/* Amount input — only when token is selected */}
          {activeTokenAddr && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Your balance</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>
                  {walletTokenFormatted !== null ? walletTokenFormatted.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '...'} {tokenSymbol as string || ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Amount</label>
                  <input className="input-field" type="number" min="0" placeholder="0" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} />
                </div>
                <button onClick={() => walletTokenFormatted !== null && setTokenAmount(walletTokenFormatted.toFixed(6))} className="btn-ghost" style={{ paddingBottom: '0.55rem' }}>Max</button>
                <button className="btn-primary" disabled={!tokenAmount} onClick={handleDepositERC20} style={{ flexShrink: 0 }}>Deposit</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NFT */}
      {tab === 'nft' && (
        <div className="card">
          <div className="label">Deposit NFT</div>
          <div style={{ display: 'flex', gap: '0.375rem', margin: '0.5rem 0' }}>
            {(['erc721', 'erc1155'] as const).map((t) => (
              <button key={t} onClick={() => setNftType(t)} style={{
                flex: 1, padding: '0.4rem', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s',
                border: `1px solid ${nftType === t ? 'var(--accent)' : 'var(--border)'}`, background: nftType === t ? 'var(--accent-bg)' : 'var(--bg)', color: nftType === t ? 'var(--accent)' : 'var(--text-3)',
              }}>{t === 'erc721' ? 'ERC-721' : 'ERC-1155'}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.5rem' }}>
            <div>
              <label className="label">NFT Contract</label>
              <input className="input-field" placeholder="0x..." value={nftAddress} onChange={(e) => setNftAddress(e.target.value)} style={{ fontFamily: 'monospace' }} />
              {nftName && <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.2rem' }}>Collection: {nftName as string}</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: nftType === 'erc1155' ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
              <div><label className="label">Token ID</label><input className="input-field" type="number" min="0" placeholder="0" value={nftTokenId} onChange={(e) => setNftTokenId(e.target.value)} /></div>
              {nftType === 'erc1155' && <div><label className="label">Amount</label><input className="input-field" type="number" min="1" placeholder="1" value={nftAmount} onChange={(e) => setNftAmount(e.target.value)} /></div>}
            </div>
            <button className="btn-primary" disabled={!nftAddress || !nftTokenId} onClick={handleDepositNFT} style={{ marginTop: '0.25rem' }}>Approve & Deposit NFT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Token Row with wallet balance ──────────────────────────────────────────
function TokenSelectRow({ tokenAddress, walletAddress, selected, onSelect }: {
  tokenAddress: `0x${string}`; walletAddress: `0x${string}`; selected: boolean; onSelect: () => void;
}) {
  const { data: symbol } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'symbol' });
  const { data: name } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'name' });
  const { data: decimals } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'decimals' });
  const { data: bal } = useReadContract({ address: tokenAddress, abi: ERC20ABI, functionName: 'balanceOf', args: [walletAddress] });
  const fmt = bal && decimals ? parseFloat(formatUnits(bal as bigint, decimals as number)) : null;

  return (
    <div className={`token-row ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div>
        <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-1)' }}>{(name as string) || '...'}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', fontFamily: 'monospace' }}>{tokenAddress.slice(0, 10)}...{tokenAddress.slice(-4)}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-1)' }}>{fmt !== null ? fmt.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '...'}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{(symbol as string) || ''}</div>
      </div>
    </div>
  );
}
