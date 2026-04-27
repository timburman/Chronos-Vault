'use client';

import { usePublicClient } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { useState, useEffect } from 'react';
import { formatEther, type Log } from 'viem';
import {
  ArrowDownToLine, ArrowUpFromLine, Activity as ActivityIcon,
  Clock, ExternalLink, KeyRound, ShieldCheck, Pause, Play, Loader2,
} from 'lucide-react';

interface Props { vaultAddress: `0x${string}` }

interface VaultEvent {
  name: string;
  args: Record<string, unknown>;
  blockNumber: bigint;
  transactionHash: string;
}

const EVENT_META: Record<string, { label: string; Icon: typeof ArrowDownToLine; className: string }> = {
  Funded:                { label: 'ETH Deposited',          Icon: ArrowDownToLine,  className: 'icon-box-success' },
  FundedERC20:           { label: 'Token Deposited',        Icon: ArrowDownToLine,  className: 'icon-box-success' },
  FundedERC721:          { label: 'NFT Deposited',          Icon: ArrowDownToLine,  className: 'icon-box-success' },
  FundedERC1155:         { label: 'ERC-1155 Deposited',     Icon: ArrowDownToLine,  className: 'icon-box-success' },
  Withdrawn:             { label: 'ETH Withdrawn',          Icon: ArrowUpFromLine,  className: 'icon-box-accent' },
  WithdrawnERC20:        { label: 'Token Withdrawn',        Icon: ArrowUpFromLine,  className: 'icon-box-accent' },
  WithdrawnERC721:       { label: 'NFT Withdrawn',          Icon: ArrowUpFromLine,  className: 'icon-box-accent' },
  WithdrawnERC1155:      { label: 'ERC-1155 Withdrawn',     Icon: ArrowUpFromLine,  className: 'icon-box-accent' },
  Pinged:                { label: 'Proof of Life',          Icon: ActivityIcon,     className: 'icon-box-success' },
  Claimed:               { label: 'Inheritance Claimed',    Icon: KeyRound,         className: 'icon-box-danger' },
  ClaimedERC20:          { label: 'Token Claimed',          Icon: KeyRound,         className: 'icon-box-danger' },
  ClaimedERC721:         { label: 'NFT Claimed',            Icon: KeyRound,         className: 'icon-box-danger' },
  ClaimedERC1155:        { label: 'ERC-1155 Claimed',       Icon: KeyRound,         className: 'icon-box-danger' },
  BatchClaimedERC721:    { label: 'Batch NFT Claim',        Icon: KeyRound,         className: 'icon-box-danger' },
  BatchClaimedERC1155:   { label: 'Batch ERC-1155 Claim',   Icon: KeyRound,         className: 'icon-box-danger' },
  GuardianAdded:         { label: 'Guardian Added',         Icon: ShieldCheck,      className: 'icon-box-success' },
  GuardianRemoved:       { label: 'Guardian Removed',       Icon: ShieldCheck,      className: 'icon-box-muted' },
  BeneficiaryChanged:    { label: 'Beneficiary Changed',    Icon: KeyRound,         className: 'icon-box-accent' },
  VaultPausedEvent:      { label: 'Vault Paused',           Icon: Pause,            className: 'icon-box-danger' },
  VaultUnpaused:         { label: 'Vault Unpaused',         Icon: Play,             className: 'icon-box-success' },
};

function formatEventDetail(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'Funded':
    case 'Withdrawn':
    case 'Claimed':
      return args.amount ? `${parseFloat(formatEther(args.amount as bigint)).toFixed(4)} ETH` : '';
    case 'FundedERC20':
    case 'WithdrawnERC20':
    case 'ClaimedERC20':
      return `Token: ${(args.token as string || '').slice(0, 10)}...`;
    case 'FundedERC721':
    case 'WithdrawnERC721':
    case 'ClaimedERC721':
      return `NFT #${args.tokenId?.toString() || '?'}`;
    case 'BatchClaimedERC721': {
      const ids = args.tokenIds as bigint[] | undefined;
      return ids ? `${ids.length} NFT(s)` : 'Batch';
    }
    case 'BatchClaimedERC1155': {
      const ids = args.tokenIds as bigint[] | undefined;
      return ids ? `${ids.length} item(s)` : 'Batch';
    }
    case 'GuardianAdded':
    case 'GuardianRemoved':
      return `${(args.guardian as string || '').slice(0, 10)}...${(args.guardian as string || '').slice(-4)}`;
    case 'Pinged':
      return args.timestamp ? new Date(Number(args.timestamp) * 1000).toLocaleTimeString() : '';
    default:
      return '';
  }
}

// ─── Chunked log fetcher ────────────────────────────────────────────────────
// Uses 2 000-block chunks to stay within RPC log limits.
// On small chains (Anvil/testnet < 100 000 blocks) it falls back to a
// single query so local dev stays instant.
const CHUNK_SIZE = BigInt(2000);
const SMALL_CHAIN_THRESHOLD = BigInt(100_000);

async function fetchLogsChunked(
  publicClient: ReturnType<typeof usePublicClient>,
  vaultAddress: `0x${string}`,
  onProgress?: (pct: number) => void,
): Promise<Log[]> {
  if (!publicClient) return [];

  const latest = await publicClient.getBlockNumber();

  // Single-shot for tiny chains (Anvil)
  if (latest <= SMALL_CHAIN_THRESHOLD) {
    return publicClient.getLogs({ address: vaultAddress, fromBlock: BigInt(0), toBlock: 'latest' });
  }

  // Chunked for mainnet / long-running testnets
  const allLogs: Log[] = [];
  let from = BigInt(0);
  const totalBlocks = Number(latest);

  while (from <= latest) {
    const to = from + CHUNK_SIZE - BigInt(1) > latest ? latest : from + CHUNK_SIZE - BigInt(1);
    const chunk = await publicClient.getLogs({ address: vaultAddress, fromBlock: from, toBlock: to });
    allLogs.push(...chunk);
    onProgress?.(Math.round((Number(to) / totalBlocks) * 100));
    from = to + BigInt(1);
  }

  return allLogs;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Activity({ vaultAddress }: Props) {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      if (!publicClient) return;
      setLoading(true);
      setProgress(0);

      try {
        const logs = await fetchLogsChunked(publicClient, vaultAddress, (pct) => {
          if (!cancelled) setProgress(pct);
        });

        if (cancelled) return;

        const eventAbis = (VaultABI as readonly Record<string, unknown>[]).filter((a) => a.type === 'event');
        const decoded: VaultEvent[] = [];

        for (const log of logs) {
          for (const eventAbi of eventAbis) {
            try {
              const { decodeEventLog } = await import('viem');
              const result = decodeEventLog({
                abi: [eventAbi],
                data: (log as Log).data,
                topics: (log as Log).topics,
              });
              decoded.push({
                name: ((result as { eventName?: string }).eventName as string) || '',
                args: (result.args || {}) as Record<string, unknown>,
                blockNumber: log.blockNumber || BigInt(0),
                transactionHash: (log as Log).transactionHash || '',
              });
              break;
            } catch {
              // Not this event type — try next
            }
          }
        }

        decoded.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
        setEvents(decoded);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }

      if (!cancelled) setLoading(false);
    }

    fetchEvents();
    return () => { cancelled = true; };
  }, [vaultAddress, publicClient]);

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Activity</h1>

      <div className="card">
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-4)', fontSize: '0.82rem' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Fetching on-chain events…
            </div>
            {progress > 0 && progress < 100 && (
              <div style={{ width: '100%', maxWidth: '240px', height: '3px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: '99px', transition: 'width 0.3s ease' }} />
              </div>
            )}
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem' }}>
            No activity yet. Deposit some assets to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {events.map((ev, i) => {
              const meta = EVENT_META[ev.name] || { label: ev.name, Icon: Clock, className: 'icon-box-muted' };
              const detail = formatEventDetail(ev.name, ev.args);
              return (
                <div
                  key={`${ev.transactionHash}-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0',
                    borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div className={`icon-box ${meta.className}`} style={{ width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0 }}>
                    <meta.Icon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-1)' }}>{meta.label}</div>
                    {detail && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginTop: '0.05rem' }}>{detail}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>Block {ev.blockNumber.toString()}</div>
                  </div>
                  {ev.transactionHash && (
                    <a
                      href={`https://etherscan.io/tx/${ev.transactionHash}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--text-4)', flexShrink: 0 }}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
