'use client';

import { useWriteContract, useReadContract } from 'wagmi';
import { VaultABI, ERC20ABI } from '@/utils/abi';
import { parseEther, parseUnits, formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';

interface Props { vaultAddress: `0x${string}` }

const ETH_PRESETS = ['0.01', '0.1', '0.5', '1'] as const;

export default function Deposit({ vaultAddress }: Props) {
  const [ethAmount, setEthAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('18');
  const [ethStatus, setEthStatus]     = useState<'idle' | 'ok' | 'err'>('idle');
  const [erc20Status, setErc20Status] = useState<'idle' | 'approving' | 'depositing' | 'ok' | 'err'>('idle');
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => { fetchETHPrice().then(setEthPrice); }, []);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance',
  });

  // Optionally fetch token symbol when user enters address
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress.length === 42 ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20ABI,
    functionName: 'symbol',
    query: { enabled: tokenAddress.length === 42 },
  });
  const { data: tokenName } = useReadContract({
    address: tokenAddress.length === 42 ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20ABI,
    functionName: 'name',
    query: { enabled: tokenAddress.length === 42 },
  });

  const { writeContractAsync } = useWriteContract();

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const ethUsd = (parseFloat(ethBal) * ethPrice).toFixed(2);
  const selectedUsd = ethAmount && ethPrice ? (parseFloat(ethAmount) * ethPrice).toFixed(2) : null;

  const handleDepositETH = async () => {
    if (!ethAmount) return;
    try {
      setEthStatus('idle');
      await writeContractAsync({
        address: vaultAddress,
        abi: VaultABI,
        functionName: 'depositETH',
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

      {/* Deposit ETH */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Deposit ETH</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
          Send ETH into the vault using the explicit deposit function. Funds are immediately secured.
        </p>

        {/* Presets */}
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
            <input
              className="input-field"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
            />
            {selectedUsd && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-4)', marginTop: '0.3rem' }}>≈ ${selectedUsd} USD</div>
            )}
          </div>
          <button className="btn-primary" disabled={!ethAmount} onClick={handleDepositETH} style={{ flexShrink: 0 }}>
            Deposit ETH
          </button>
        </div>

        {ethStatus === 'ok'  && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.75rem' }}>ETH deposited successfully.</p>}
        {ethStatus === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Transaction failed. Check your balance and network.</p>}
      </div>

      {/* Deposit ERC20 */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Deposit ERC-20 Token</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
          Two steps: first approve the vault to spend your tokens, then deposit. Just the contract address is needed.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Token Contract Address</label>
            <input
              className="input-field"
              placeholder="0x…"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
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
        {erc20Status === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Transaction failed. Ensure the token address is correct and you have approved sufficient allowance.</p>}
      </div>
    </div>
  );
}
