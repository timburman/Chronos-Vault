'use client';

import { useWriteContract, useReadContract } from 'wagmi';
import { VaultABI, ERC20ABI } from '@/utils/abi';
import { formatEther, parseEther, parseUnits, formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import { fetchETHPrice } from '@/utils/price';

interface Props { vaultAddress: `0x${string}` }

const ETH_PERCENT_PRESETS = [
  { label: '25%', pct: 0.25 },
  { label: '50%', pct: 0.50 },
  { label: '75%', pct: 0.75 },
  { label: 'Max', pct: 1.00 },
] as const;

export default function Withdraw({ vaultAddress }: Props) {
  const [ethAmount, setEthAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('18');
  const [ethStatus, setEthStatus]   = useState<'idle' | 'ok' | 'err'>('idle');
  const [erc20Status, setErc20Status] = useState<'idle' | 'ok' | 'err'>('idle');
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => { fetchETHPrice().then(setEthPrice); }, []);

  const { data: balance, refetch } = useReadContract({
    address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance',
  });
  const { data: tokenBal } = useReadContract({
    address: tokenAddress.length === 42 ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [vaultAddress],
    query: { enabled: tokenAddress.length === 42 },
  });
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

  const { writeContractAsync } = useWriteContract();

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const ethUsd = (parseFloat(ethBal) * ethPrice).toFixed(2);
  const selectedUsd = ethAmount && ethPrice ? (parseFloat(ethAmount) * ethPrice).toFixed(2) : null;
  const decimals = parseInt(tokenDecimals) || 18;
  const tokenBalFormatted = tokenBal ? parseFloat(formatUnits(tokenBal as bigint, decimals)) : null;

  const applyPct = (pct: number) => {
    const raw = parseFloat(ethBal) * pct;
    setEthAmount(raw.toFixed(6));
  };

  const handleWithdrawETH = async () => {
    try {
      setEthStatus('idle');
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'withdraw', args: [parseEther(ethAmount)] });
      setEthStatus('ok');
      setEthAmount('');
      setTimeout(refetch, 2500);
    } catch { setEthStatus('err'); }
  };

  const handleWithdrawERC20 = async () => {
    const token = tokenAddress.trim() as `0x${string}`;
    try {
      setErc20Status('idle');
      await writeContractAsync({
        address: vaultAddress, abi: VaultABI, functionName: 'withdrawERC20',
        args: [token, parseUnits(tokenAmount, decimals)],
      });
      setErc20Status('ok');
      setTokenAmount('');
    } catch { setErc20Status('err'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)' }}>Withdraw</h1>

      {/* Balance banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '0.875rem 1.25rem',
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '0.2rem' }}>
            Available to Withdraw
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-1)' }}>
            {parseFloat(ethBal).toFixed(6)} ETH
            {ethPrice > 0 && <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '0.85rem', marginLeft: '0.625rem' }}>≈ ${ethUsd}</span>}
          </div>
        </div>
      </div>

      {/* Withdraw ETH */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Withdraw ETH</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
          Send a partial or full ETH balance back to your wallet. Only the vault owner can do this.
        </p>

        {/* Percentage presets */}
        <div style={{ marginBottom: '1rem' }}>
          <div className="label" style={{ marginBottom: '0.5rem' }}>Quick withdraw</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {ETH_PERCENT_PRESETS.map(({ label, pct }) => {
              const val = (parseFloat(ethBal) * pct).toFixed(6);
              return (
                <button
                  key={label}
                  onClick={() => applyPct(pct)}
                  style={{
                    flex: 1, padding: '0.4rem 0', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer',
                    border: `1px solid ${ethAmount === val ? 'var(--text-1)' : 'var(--border)'}`,
                    background: ethAmount === val ? 'var(--text-1)' : 'var(--bg)',
                    color: ethAmount === val ? 'var(--bg)' : 'var(--text-3)',
                    fontWeight: 500,
                    transition: 'all 0.12s',
                  }}
                >
                  {label}
                </button>
              );
            })}
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
          <button className="btn-primary" disabled={!ethAmount || parseFloat(ethBal) === 0} onClick={handleWithdrawETH} style={{ flexShrink: 0 }}>
            Withdraw
          </button>
        </div>
        {ethStatus === 'ok'  && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Withdrawn successfully.</p>}
        {ethStatus === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Transaction failed.</p>}
      </div>

      {/* Withdraw ERC20 */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.25rem' }}>Withdraw ERC-20 Token</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
          Specify the token and amount to withdraw from the vault back to your wallet.
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
                {tokenBalFormatted !== null && (
                  <span style={{ color: 'var(--text-2)', marginLeft: '0.5rem' }}>
                    — Vault holds {tokenBalFormatted.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenSymbol as string}
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div>
              <label className="label">Amount</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input className="input-field" type="number" min="0" placeholder="100" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} />
              </div>
            </div>
            {tokenBalFormatted !== null && (
              <button
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.5rem 0.75rem', alignSelf: 'flex-end' }}
                onClick={() => setTokenAmount(tokenBalFormatted.toFixed(6))}
              >
                Max
              </button>
            )}
            <div>
              <label className="label">Decimals</label>
              <input className="input-field" type="number" placeholder="18" value={tokenDecimals} onChange={(e) => setTokenDecimals(e.target.value)} />
            </div>
          </div>

          <button className="btn-primary" disabled={!tokenAddress || !tokenAmount} onClick={handleWithdrawERC20}>
            Withdraw Token
          </button>
        </div>
        {erc20Status === 'ok'  && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Token withdrawn successfully.</p>}
        {erc20Status === 'err' && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>Transaction failed.</p>}
      </div>
    </div>
  );
}
