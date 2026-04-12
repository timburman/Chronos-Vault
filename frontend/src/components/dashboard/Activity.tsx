'use client';

import { useState, useEffect } from 'react';
import { fetchVaultTransfers, isAlchemyAvailable } from '@/utils/alchemy';
import type { AssetTransfer } from '@/utils/alchemy';

interface Props { vaultAddress: `0x${string}` }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function classifyTransfer(tx: AssetTransfer, vaultAddr: string): { type: string; icon: string; color: string } {
  const isIncoming = tx.to.toLowerCase() === vaultAddr.toLowerCase();
  if (tx.category === 'erc721' || tx.category === 'erc1155') {
    return isIncoming
      ? { type: 'NFT Deposit', icon: '🖼️', color: 'var(--success)' }
      : { type: 'NFT Withdrawal', icon: '🖼️', color: 'var(--accent)' };
  }
  if (tx.category === 'erc20') {
    return isIncoming
      ? { type: 'Token Deposit', icon: '💰', color: 'var(--success)' }
      : { type: 'Token Withdrawal', icon: '📤', color: 'var(--accent)' };
  }
  return isIncoming
    ? { type: 'ETH Deposit', icon: '⬇️', color: 'var(--success)' }
    : { type: 'ETH Withdrawal', icon: '⬆️', color: 'var(--accent)' };
}

export default function Activity({ vaultAddress }: Props) {
  const [transfers, setTransfers] = useState<(AssetTransfer & { direction: 'in' | 'out' })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAlchemyAvailable()) { setLoading(false); return; }
    fetchVaultTransfers(vaultAddress).then(({ incoming, outgoing }) => {
      const all = [
        ...incoming.map((t) => ({ ...t, direction: 'in' as const })),
        ...outgoing.map((t) => ({ ...t, direction: 'out' as const })),
      ].sort((a, b) => new Date(b.metadata.blockTimestamp).getTime() - new Date(a.metadata.blockTimestamp).getTime());
      setTransfers(all);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [vaultAddress]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: '1.6rem', color: 'var(--text-1)' }}>Activity</h1>

      <div className="card">
        {!isAlchemyAvailable() ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.85rem' }}>
            Set <code style={{ fontSize: '0.78rem' }}>NEXT_PUBLIC_ALCHEMY_KEY</code> in your .env to view transaction history.
          </div>
        ) : loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.85rem' }}>
            Loading transaction history…
          </div>
        ) : transfers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.85rem' }}>
            No transactions found for this vault.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transfers.map((tx, i) => {
              const info = classifyTransfer(tx, vaultAddress);
              return (
                <div
                  key={`${tx.hash}-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.875rem 0',
                    borderBottom: i < transfers.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', flexShrink: 0,
                  }}>
                    {info.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.88rem', color: info.color }}>{info.type}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>
                        {timeAgo(tx.metadata.blockTimestamp)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-4)', marginTop: '0.15rem' }}>
                      {tx.direction === 'in' ? 'From' : 'To'}: {(tx.direction === 'in' ? tx.from : tx.to).slice(0, 10)}…{(tx.direction === 'in' ? tx.from : tx.to).slice(-6)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {tx.value !== null && (
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-1)' }}>
                        {tx.direction === 'in' ? '+' : '-'}{typeof tx.value === 'number' ? tx.value.toFixed(4) : tx.value}
                        {tx.asset && <span style={{ color: 'var(--text-4)', fontWeight: 400, marginLeft: '0.25rem' }}>{tx.asset}</span>}
                      </div>
                    )}
                    {tx.erc721TokenId && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>ID: {tx.erc721TokenId}</div>
                    )}
                  </div>

                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.72rem', color: 'var(--text-4)', textDecoration: 'none',
                      padding: '0.25rem 0.5rem', borderRadius: '4px',
                      border: '1px solid var(--border)', flexShrink: 0,
                    }}
                  >
                    View ↗
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
