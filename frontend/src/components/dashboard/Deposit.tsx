'use client';

import { useWriteContract, useReadContract } from 'wagmi';
import { VaultABI, ERC20ABI, ERC721ABI, ERC1155ABI } from '@/utils/abi';
import { parseEther, parseUnits, formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';

interface Props { vaultAddress: `0x${string}` }

const ETH_PRESETS = ['0.01', '0.1', '0.5', '1'] as const;

type DepositTab = 'eth' | 'erc20' | 'nft';

export default function Deposit({ vaultAddress }: Props) {
  const [tab, setTab] = useState<DepositTab>('eth');
  const [ethAmount, setEthAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('18');
  const [nftAddress, setNftAddress] = useState('');
  const [nftTokenId, setNftTokenId] = useState('');
  const [nftType, setNftType] = useState<'erc721' | 'erc1155'>('erc721');
  const [nftAmount, setNftAmount] = useState('1');
  const [ethStatus, setEthStatus]     = useState<'idle' | 'ok' | 'err'>('idle');
  const [erc20Status, setErc20Status] = useState<'idle' | 'approving' | 'depositing' | 'ok' | 'err'>('idle');
  const [nftStatus, setNftStatus]     = useState<'idle' | 'approving' | 'depositing' | 'ok' | 'err'>('idle');
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => { fetchETHPrice().then(setEthPrice); }, []);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance',
  });

  // Token metadata auto-detect
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress.length === 42 ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20ABI, functionName: 'symbol',
    query: { enabled: tokenAddress.length === 42 },
  });
  const { data: tokenName } = useReadContract({
    address: tokenAddress.length === 42 ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20ABI, functionName: 'name',
    query: { enabled: tokenAddress.length === 42 },
  });
  const { data: tokenDecimalsData } = useReadContract({
    address: tokenAddress.length === 42 ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20ABI, functionName: 'decimals',
    query: { enabled: tokenAddress.length === 42 },
  });

  // NFT metadata
  const { data: nftName } = useReadContract({
    address: nftAddress.length === 42 ? nftAddress as `0x${string}` : undefined,
    abi: ERC721ABI, functionName: 'name',
    query: { enabled: nftAddress.length === 42 },
  });

  // Auto-fill decimals
  useEffect(() => {
    if (tokenDecimalsData !== undefined) setTokenDecimals(String(tokenDecimalsData));
  }, [tokenDecimalsData]);

  const { writeContractAsync } = useWriteContract();

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const ethUsd = (parseFloat(ethBal) * ethPrice).toFixed(2);
  const selectedUsd = ethAmount && ethPrice ? (parseFloat(ethAmount) * ethPrice).toFixed(2) : null;

  const handleDepositETH = async () => {
    if (!ethAmount) return;
    try {
      setEthStatus('idle');
      await writeContractAsync({
        address: vaultAddress, abi: VaultABI, functionName: 'depositETH',
        value: parseEther(ethAmount),
      });
      setEthStatus('ok');
      setEthAmount('');
      setTimeout(refetchBalance, 2500);
    } catch { setEthStatus('err'); }
  };

  const handleDepositERC20 = async () => {
    if (!tokenAddress || !tokenAmount) return;
    const decimals = parseInt(tokenDecimals) || 18;
    const amount = parseUnits(tokenAmount, decimals);
    const token = tokenAddress.trim() as `0x${string}`;
    try {
      setErc20Status('approving');
      await writeContractAsync({ address: token, abi: ERC20ABI, functionName: 'approve', args: [vaultAddress, amount] });
      setErc20Status('depositing');
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'depositERC20', args: [token, amount] });
      setErc20Status('ok');
      setTokenAmount('');
    } catch { setErc20Status('err'); }
  };

  const handleDepositNFT = async () => {
    if (!nftAddress || !nftTokenId) return;
    const nftAddr = nftAddress.trim() as `0x${string}`;
    const tokenId = BigInt(nftTokenId);
    try {
      setNftStatus('approving');
      if (nftType === 'erc721') {
        await writeContractAsync({ address: nftAddr, abi: ERC721ABI, functionName: 'approve', args: [vaultAddress, tokenId] });
        setNftStatus('depositing');
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'depositERC721', args: [nftAddr, tokenId] });
      } else {
        await writeContractAsync({ address: nftAddr, abi: ERC1155ABI, functionName: 'setApprovalForAll', args: [vaultAddress, true] });
        setNftStatus('depositing');
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'depositERC1155', args: [nftAddr, tokenId, BigInt(nftAmount)] });
      }
      setNftStatus('ok');
      setNftTokenId('');
    } catch { setNftStatus('err'); }
  };

  const tabs: { id: DepositTab; label: string }[] = [
    { id: 'eth',   label: 'ETH' },
    { id: 'erc20', label: 'ERC-20' },
    { id: 'nft',   label: 'NFT' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)' }}>Deposit</h1>

      {/* Current vault balance banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--accent-bg)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '0.875rem 1.25rem',
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.2rem' }}>
            Current Vault Balance
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-1)' }}>
            {parseFloat(ethBal).toFixed(6)} ETH
            {ethPrice > 0 && <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '0.85rem', marginLeft: '0.625rem' }}>≈ ${ethUsd}</span>}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface)', borderRadius: '8px', padding: '0.25rem' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'all 0.12s',
              background: tab === t.id ? 'var(--bg)' : 'transparent',
              color: tab === t.id ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ETH Tab */}
      {tab === 'eth' && (
        <div className="card">
          <div className="label" style={{ marginBottom: '0.25rem' }}>Deposit ETH</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
            Send ETH into the vault using the explicit deposit function. Funds are immediately secured.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <div className="label" style={{ marginBottom: '0.5rem' }}>Quick amounts</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {ETH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setEthAmount(preset)}
                  style={{
                    padding: '0.4rem 0.875rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer',
                    border: `1px solid ${ethAmount === preset ? 'var(--accent)' : 'var(--border)'}`,
                    background: ethAmount === preset ? 'var(--accent-bg)' : 'var(--bg)',
                    color: ethAmount === preset ? 'var(--accent)' : 'var(--text-3)',
                    fontWeight: ethAmount === preset ? 600 : 400,
                    transition: 'all 0.12s',
                  }}
                >
                  {preset} ETH
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Custom amount (ETH)</label>
              <input className="input-field" type="number" min="0" step="any" placeholder="0.00" value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} />
              {selectedUsd && <div style={{ fontSize: '0.75rem', color: 'var(--text-4)', marginTop: '0.3rem' }}>≈ ${selectedUsd} USD</div>}
            </div>
            <button className="btn-primary" disabled={!ethAmount} onClick={handleDepositETH} style={{ flexShrink: 0 }}>
              Deposit ETH
            </button>
          </div>

          {ethStatus === 'ok'  && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.75rem' }}>ETH deposited successfully.</p>}
          {ethStatus === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Transaction failed. Check your balance and network.</p>}
        </div>
      )}

      {/* ERC-20 Tab */}
      {tab === 'erc20' && (
        <div className="card">
          <div className="label" style={{ marginBottom: '0.25rem' }}>Deposit ERC-20 Token</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
            Two steps: first approve the vault to spend your tokens, then deposit. Decimals auto-fill from the contract.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Token Contract Address</label>
              <input className="input-field" placeholder="0x…" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} style={{ fontFamily: 'monospace' }} />
              {tokenName && (
                <div style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '0.35rem' }}>
                  Detected: {tokenName as string} ({tokenSymbol as string})
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Amount</label>
                <input className="input-field" type="number" min="0" placeholder="100" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} />
              </div>
              <div>
                <label className="label">Token Decimals</label>
                <input className="input-field" type="number" min="0" max="18" placeholder="18" value={tokenDecimals} onChange={(e) => setTokenDecimals(e.target.value)} />
              </div>
            </div>

            <button
              className="btn-primary"
              disabled={!tokenAddress || !tokenAmount || erc20Status === 'approving' || erc20Status === 'depositing'}
              onClick={handleDepositERC20}
            >
              {erc20Status === 'approving' ? 'Step 1/2 — Approving…' : erc20Status === 'depositing' ? 'Step 2/2 — Depositing…' : 'Approve & Deposit'}
            </button>
          </div>

          {erc20Status === 'ok'  && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Token deposited successfully.</p>}
          {erc20Status === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Transaction failed. Ensure the token address is correct and you have sufficient balance.</p>}
        </div>
      )}

      {/* NFT Tab */}
      {tab === 'nft' && (
        <div className="card">
          <div className="label" style={{ marginBottom: '0.25rem' }}>Deposit NFT</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
            Deposit an ERC-721 or ERC-1155 NFT into the vault for inheritance. Two steps: approve, then deposit.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Type toggle */}
            <div>
              <label className="label">NFT Standard</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['erc721', 'erc1155'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNftType(type)}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.12s',
                      border: `1px solid ${nftType === type ? 'var(--accent)' : 'var(--border)'}`,
                      background: nftType === type ? 'var(--accent-bg)' : 'var(--bg)',
                      color: nftType === type ? 'var(--accent)' : 'var(--text-3)',
                    }}
                  >
                    {type === 'erc721' ? 'ERC-721 (1/1 NFT)' : 'ERC-1155 (Multi)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">NFT Contract Address</label>
              <input className="input-field" placeholder="0x…" value={nftAddress} onChange={(e) => setNftAddress(e.target.value)} style={{ fontFamily: 'monospace' }} />
              {nftName && <div style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '0.35rem' }}>Collection: {nftName as string}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: nftType === 'erc1155' ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Token ID</label>
                <input className="input-field" type="number" min="0" placeholder="0" value={nftTokenId} onChange={(e) => setNftTokenId(e.target.value)} />
              </div>
              {nftType === 'erc1155' && (
                <div>
                  <label className="label">Amount</label>
                  <input className="input-field" type="number" min="1" placeholder="1" value={nftAmount} onChange={(e) => setNftAmount(e.target.value)} />
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              disabled={!nftAddress || !nftTokenId || nftStatus === 'approving' || nftStatus === 'depositing'}
              onClick={handleDepositNFT}
            >
              {nftStatus === 'approving' ? 'Step 1/2 — Approving…' : nftStatus === 'depositing' ? 'Step 2/2 — Depositing…' : 'Approve & Deposit NFT'}
            </button>
          </div>

          {nftStatus === 'ok'  && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.75rem' }}>NFT deposited successfully.</p>}
          {nftStatus === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Transaction failed. Ensure you own the NFT and the address is correct.</p>}
        </div>
      )}
    </div>
  );
}
