'use client';

import { usePublicClient } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { useState, useEffect } from 'react';
import { formatEther, type Log } from 'viem';
import { ArrowDownToLine, ArrowUpFromLine, Activity as ActivityIcon, Clock, ExternalLink, KeyRound, ShieldCheck, Pause, Play } from 'lucide-react';

interface Props { vaultAddress: `0x${string}` }

interface VaultEvent {
  name: string;
  args: Record<string, unknown>;
  blockNumber: bigint;
  transactionHash: string;
  timestamp?: number;
}

const EVENT_META: Record<string, { label: string; Icon: typeof ArrowDownToLine; className: string }> = {
  Funded:              { label: 'ETH Deposited',        Icon: ArrowDownToLine,  className: 'icon-box-success' },
  FundedERC20:         { label: 'Token Deposited',      Icon: ArrowDownToLine,  className: 'icon-box-success' },
  FundedERC721:        { label: 'NFT Deposited',        Icon: ArrowDownToLine,  className: 'icon-box-success' },
  FundedERC1155:       { label: 'ERC-1155 Deposited',   Icon: ArrowDownToLine,  className: 'icon-box-success' },
  Withdrawn:           { label: 'ETH Withdrawn',        Icon: ArrowUpFromLine,  className: 'icon-box-accent' },
  WithdrawnERC20:      { label: 'Token Withdrawn',      Icon: ArrowUpFromLine,  className: 'icon-box-accent' },
  WithdrawnERC721:     { label: 'NFT Withdrawn',        Icon: ArrowUpFromLine,  className: 'icon-box-accent' },
  WithdrawnERC1155:    { label: 'ERC-1155 Withdrawn',   Icon: ArrowUpFromLine,  className: 'icon-box-accent' },
  Pinged:              { label: 'Proof of Life',        Icon: ActivityIcon,     className: 'icon-box-success' },
  Claimed:             { label: 'Inheritance Claimed',  Icon: KeyRound,         className: 'icon-box-danger' },
  ClaimedERC20:        { label: 'Token Claimed',        Icon: KeyRound,         className: 'icon-box-danger' },
  ClaimedERC721:       { label: 'NFT Claimed',          Icon: KeyRound,         className: 'icon-box-danger' },
  ClaimedERC1155:      { label: 'ERC-1155 Claimed',     Icon: KeyRound,         className: 'icon-box-danger' },
  GuardianAdded:       { label: 'Guardian Added',       Icon: ShieldCheck,      className: 'icon-box-success' },
  GuardianRemoved:     { label: 'Guardian Removed',     Icon: ShieldCheck,      className: 'icon-box-muted' },
  BeneficiaryChanged:  { label: 'Beneficiary Changed',  Icon: KeyRound,         className: 'icon-box-accent' },
  Paused:              { label: 'Vault Paused',         Icon: Pause,            className: 'icon-box-danger' },
  Unpaused:            { label: 'Vault Unpaused',       Icon: Play,             className: 'icon-box-success' },
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
    case 'GuardianAdded':
    case 'GuardianRemoved':
      return `${(args.guardian as string || '').slice(0, 10)}...${(args.guardian as string || '').slice(-4)}`;
    case 'Pinged':
      return args.timestamp ? new Date(Number(args.timestamp) * 1000).toLocaleTimeString() : '';
    default:
      return '';
  }
}

export default function Activity({ vaultAddress }: Props) {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      if (!publicClient) return;
      try {
        const logs = await publicClient.getLogs({
          address: vaultAddress,
          fromBlock: BigInt(0),
          toBlock: 'latest',
        });

        // Decode events using the ABI
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
                name: ((result as any).eventName as string) || '',
                args: (result.args || {}) as Record<string, unknown>,
                blockNumber: log.blockNumber || BigInt(0),
                transactionHash: (log as Log).transactionHash || '',
              });
              break;
            } catch {
              // Not this event
            }
          }
        }

        // Sort descending (newest first)
        decoded.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
        setEvents(decoded);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
      setLoading(false);
    }
    fetchEvents();
  }, [vaultAddress, publicClient]);

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Activity</h1>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem' }}>Loading events from chain...</div>
        ) : events.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem' }}>No activity yet. Deposit some assets to get started.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {events.map((ev, i) => {
              const meta = EVENT_META[ev.name] || { label: ev.name, Icon: Clock, className: 'icon-box-muted' };
              const detail = formatEventDetail(ev.name, ev.args);
              return (
                <div key={`${ev.transactionHash}-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0',
                  borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div className={`icon-box ${meta.className}`} style={{ width: '32px', height: '32px', borderRadius: '7px' }}>
                    <meta.Icon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-1)' }}>{meta.label}</div>
                    {detail && <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginTop: '0.05rem' }}>{detail}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>Block {ev.blockNumber.toString()}</div>
                  </div>
                  {ev.transactionHash && (
                    <a href={`https://etherscan.io/tx/${ev.transactionHash}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--text-4)', flexShrink: 0 }}>
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
