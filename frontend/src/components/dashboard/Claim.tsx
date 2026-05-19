'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { VaultABI } from '@/utils/abi';
import { formatEther } from 'viem';
import { useState, useEffect, useCallback } from 'react';
import { fetchETHPrice } from '@/utils/price';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  autoDetectTokens,
  fetchNFTs,
  isAlchemyAvailable,
  type AlchemyNFT,
} from '@/utils/alchemy';
import {
  Loader2, AlertCircle, CheckSquare, Square,
  Coins, ImageIcon, RefreshCw, Zap,
} from 'lucide-react';

interface Props { vaultAddress: `0x${string}` }

type AssetType = 'eth' | 'erc20' | 'erc721' | 'erc1155';

interface AssetItem {
  id: string;
  type: AssetType;
  label: string;
  subLabel: string;
  contractAddress?: string;
  tokenId?: string;
  amount?: string;
  logo?: string | null;
  image?: string | null;
  checked: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AssetType }) {
  const map: Record<AssetType, { label: string; color: string }> = {
    eth:     { label: 'ETH',     color: '#6270f5' },
    erc20:   { label: 'ERC-20',  color: '#34c97a' },
    erc721:  { label: 'ERC-721', color: '#f59e0b' },
    erc1155: { label: 'ERC-1155',color: '#ec4899' },
  };
  const { label, color } = map[type];
  return (
    <span style={{
      fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', padding: '0.15rem 0.45rem',
      borderRadius: '4px', background: `${color}22`, color, border: `1px solid ${color}44`,
      textTransform: 'uppercase', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function AssetRow({ asset, onToggle }: { asset: AssetItem; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem',
        borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s',
        background: asset.checked ? 'rgba(98,112,245,0.07)' : 'transparent',
        border: `1px solid ${asset.checked ? 'rgba(98,112,245,0.3)' : 'var(--border)'}`,
        marginBottom: '0.4rem',
      }}
    >
      {/* Checkbox */}
      <div style={{ color: asset.checked ? 'var(--accent)' : 'var(--text-4)', flexShrink: 0 }}>
        {asset.checked ? <CheckSquare size={16} /> : <Square size={16} />}
      </div>

      {/* Image / Icon */}
      {asset.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.image} alt={asset.label} style={{ width: 32, height: 32, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {(asset.type === 'erc721' || asset.type === 'erc1155')
            ? <ImageIcon size={14} style={{ color: 'var(--text-4)' }} />
            : <Coins size={14} style={{ color: 'var(--text-4)' }} />
          }
        </div>
      )}

      {/* Labels */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {asset.label}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginTop: '0.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {asset.subLabel}
        </div>
      </div>

      <TypeBadge type={asset.type} />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Claim({ vaultAddress }: Props) {
  const [ethPrice, setEthPrice]       = useState(0);
  const [now, setNow]                 = useState(Date.now());
  const [assets, setAssets]           = useState<AssetItem[]>([]);
  const [detecting, setDetecting]     = useState(false);
  const [claiming, setClaiming]       = useState(false);
  const [claimStep, setClaimStep]     = useState<string | null>(null);

  // Manual fallback state (shown when Alchemy is unavailable)
  const [manualERC20, setManualERC20]     = useState('');
  const [manualNFTAddr, setManualNFTAddr] = useState('');
  const [manualNFTId, setManualNFTId]     = useState('');

  const alchemyAvailable = isAlchemyAvailable();

  // Clock + ETH price
  useEffect(() => {
    fetchETHPrice().then(setEthPrice);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: balance,   refetch: refetchBalance } = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'vaultBalance' });
  const { data: lastPing }  = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'lastPingTime' });
  const { data: timeout }   = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'timeoutPeriod' });
  const { data: owner }     = useReadContract({ address: vaultAddress, abi: VaultABI, functionName: 'owner' });
  const { writeContractAsync } = useWriteContract();

  const ethBal = balance ? formatEther(balance as bigint) : '0';
  const usdBal = (parseFloat(ethBal) * ethPrice).toFixed(2);

  // Countdown
  let isUnlocked = false, d = 0, h = 0, m = 0, s = 0;
  if (lastPing && timeout) {
    const remaining = Math.max(0, (Number(lastPing) + Number(timeout)) * 1000 - now);
    isUnlocked = remaining === 0;
    d = Math.floor(remaining / 86400000);
    h = Math.floor((remaining % 86400000) / 3600000);
    m = Math.floor((remaining % 3600000) / 60000);
    s = Math.floor((remaining % 60000) / 1000);
  }

  // ─── Asset detection ──────────────────────────────────────────────────────

  const detectAssets = useCallback(async () => {
    setDetecting(true);
    const list: AssetItem[] = [];

    // ETH (always)
    const ethFloat = parseFloat(formatEther((balance as bigint) ?? BigInt(0)));
    if (ethFloat > 0) {
      list.push({
        id: 'eth',
        type: 'eth',
        label: `${ethFloat.toFixed(4)} ETH`,
        subLabel: `≈ $${(ethFloat * ethPrice).toFixed(2)}`,
        checked: true,
      });
    }

    // Alchemy-gated: ERC-20 + NFTs
    if (alchemyAvailable) {
      try {
        const [tokens, nfts] = await Promise.all([
          autoDetectTokens(vaultAddress),
          fetchNFTs(vaultAddress),
        ]);

        for (const token of tokens) {
          const raw = BigInt(token.rawBalance);
          const readable = Number(raw) / Math.pow(10, token.decimals);
          if (readable > 0) {
            list.push({
              id: `erc20-${token.address}`,
              type: 'erc20',
              label: `${readable.toFixed(4)} ${token.symbol}`,
              subLabel: token.name,
              contractAddress: token.address,
              logo: token.logo,
              checked: true,
            });
          }
        }

        for (const nft of nfts as AlchemyNFT[]) {
          const t: AssetType = nft.tokenType === 'ERC1155' ? 'erc1155' : 'erc721';
          list.push({
            id: `${t}-${nft.contract.address}-${nft.tokenId}`,
            type: t,
            label: nft.name || `#${nft.tokenId}`,
            subLabel: nft.contract.name || `${nft.contract.address.slice(0, 10)}…`,
            contractAddress: nft.contract.address,
            tokenId: nft.tokenId,
            amount: nft.balance || '1',
            image: nft.image?.thumbnailUrl || nft.image?.cachedUrl || null,
            checked: true,
          });
        }
      } catch (err) {
        console.error('[Claim] Asset detection failed:', err);
      }
    }

    setAssets(list);
    setDetecting(false);
  }, [vaultAddress, balance, ethPrice, alchemyAvailable]);

  useEffect(() => { detectAssets(); }, [detectAssets]);

  // ─── Checklist helpers ───────────────────────────────────────────────────

  const toggle = (id: string) => setAssets(prev => prev.map(a => a.id === id ? { ...a, checked: !a.checked } : a));
  const toggleAll = () => {
    const all = assets.every(a => a.checked);
    setAssets(prev => prev.map(a => ({ ...a, checked: !all })));
  };

  // ─── Claim All ───────────────────────────────────────────────────────────

  const handleClaimAll = async () => {
    const selected = assets.filter(a => a.checked);
    if (selected.length === 0) { toast.error('No assets selected'); return; }

    setClaiming(true);
    let errors = 0;

    // 1 · ETH
    const ethAsset = selected.find(a => a.type === 'eth');
    if (ethAsset) {
      setClaimStep('Claiming ETH…');
      const tid = toast.loading('Claiming ETH…');
      try {
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'claimFunds' });
        toast.success('ETH claimed!', { id: tid });
        refetchBalance();
      } catch { toast.error('ETH claim failed', { id: tid }); errors++; }
    }

    // 2 · ERC-20s (one tx each — no batch function in contract)
    for (const tok of selected.filter(a => a.type === 'erc20')) {
      setClaimStep(`Claiming ${tok.label}…`);
      const tid = toast.loading(`Claiming ${tok.label}…`);
      try {
        await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'claimERC20', args: [tok.contractAddress as `0x${string}`] });
        toast.success(`${tok.label} claimed!`, { id: tid });
      } catch { toast.error(`${tok.label} failed`, { id: tid }); errors++; }
    }

    // 3 · ERC-721s — single batch tx
    const erc721s = selected.filter(a => a.type === 'erc721');
    if (erc721s.length > 0) {
      setClaimStep(`Batch claiming ${erc721s.length} NFT(s)…`);
      const tid = toast.loading(`Batch claiming ${erc721s.length} NFT(s)…`);
      try {
        await writeContractAsync({
          address: vaultAddress, abi: VaultABI, functionName: 'batchClaimERC721',
          args: [
            erc721s.map(n => n.contractAddress as `0x${string}`),
            erc721s.map(n => BigInt(n.tokenId || '0')),
          ],
        });
        toast.success(`${erc721s.length} NFT(s) claimed!`, { id: tid });
      } catch { toast.error('NFT batch claim failed', { id: tid }); errors++; }
    }

    // 4 · ERC-1155s — single batch tx
    const erc1155s = selected.filter(a => a.type === 'erc1155');
    if (erc1155s.length > 0) {
      setClaimStep(`Batch claiming ${erc1155s.length} ERC-1155(s)…`);
      const tid = toast.loading(`Batch claiming ${erc1155s.length} ERC-1155(s)…`);
      try {
        await writeContractAsync({
          address: vaultAddress, abi: VaultABI, functionName: 'batchClaimERC1155',
          args: [
            erc1155s.map(n => n.contractAddress as `0x${string}`),
            erc1155s.map(n => BigInt(n.tokenId || '0')),
            erc1155s.map(n => BigInt(n.amount || '1')),
          ],
        });
        toast.success(`${erc1155s.length} ERC-1155(s) claimed!`, { id: tid });
      } catch { toast.error('ERC-1155 batch claim failed', { id: tid }); errors++; }
    }

    setClaimStep(null);
    setClaiming(false);
    if (errors === 0) toast.success('All selected assets claimed!');
    setTimeout(() => detectAssets(), 3000);
  };

  // ─── Manual claim handlers (fallback) ───────────────────────────────────

  const handleManualERC20 = async () => {
    if (!manualERC20.startsWith('0x')) return;
    const tid = toast.loading('Claiming ERC-20…');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'claimERC20', args: [manualERC20 as `0x${string}`] });
      toast.success('ERC-20 claimed!', { id: tid }); setManualERC20('');
    } catch { toast.error('Claim failed', { id: tid }); }
  };

  const handleManualNFT = async () => {
    if (!manualNFTAddr.startsWith('0x') || !manualNFTId) return;
    const tid = toast.loading('Claiming NFT…');
    try {
      await writeContractAsync({ address: vaultAddress, abi: VaultABI, functionName: 'claimERC721', args: [manualNFTAddr as `0x${string}`, BigInt(manualNFTId)] });
      toast.success('NFT claimed!', { id: tid }); setManualNFTAddr(''); setManualNFTId('');
    } catch { toast.error('Claim failed', { id: tid }); }
  };

  const checkedCount = assets.filter(a => a.checked).length;
  const allChecked   = assets.length > 0 && assets.every(a => a.checked);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-1)' }}>Claim Inheritance</h1>

      {/* ── Vault Status ── */}
      <div className="card">
        {isUnlocked ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="label">Status</div>
            <span className="pill-success" style={{ marginTop: '0.25rem', marginBottom: '0.75rem', display: 'inline-flex' }}>Vault Unlocked</span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.7, margin: 0 }}>
              The inactivity timeout has elapsed. You are authorized to claim the inheritance below.
            </p>
          </motion.div>
        ) : (
          <div>
            <div className="label">Status</div>
            <span className="pill-danger" style={{ marginTop: '0.25rem', marginBottom: '1rem', display: 'inline-flex' }}>Vault Locked</span>
            <div className="label" style={{ marginBottom: '0.5rem' }}>Time remaining</div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {[[d, 'Days'], [h, 'Hrs'], [m, 'Min'], [s, 'Sec']].map(([val, unit]) => (
                <div key={String(unit)} style={{ textAlign: 'center' }}>
                  <div className="countdown-digit">{String(val).padStart(2, '0')}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Owner ── */}
      <div className="card-sm">
        <div className="label" style={{ margin: 0, marginBottom: '0.15rem' }}>Vault Owner</div>
        <code style={{ fontSize: '0.78rem', color: 'var(--text-2)', wordBreak: 'break-all' }}>{(owner as string) || '—'}</code>
      </div>

      {/* ── Asset Checklist ── */}
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div className="label" style={{ margin: 0 }}>
            Assets to Claim
            {!detecting && assets.length > 0 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--text-4)', fontWeight: 400 }}>
                ({checkedCount}/{assets.length} selected)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!detecting && (
              <button onClick={() => detectAssets()} title="Refresh" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: '0.1rem' }}>
                <RefreshCw size={13} />
              </button>
            )}
            {assets.length > 0 && (
              <button onClick={toggleAll} style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>
                {allChecked ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {/* No Alchemy banner */}
        {!alchemyAvailable && (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', background: 'rgba(245,197,24,0.07)', borderRadius: '8px', border: '1px solid rgba(245,197,24,0.2)', marginBottom: '0.75rem' }}>
            <AlertCircle size={14} style={{ color: '#f5c518', flexShrink: 0, marginTop: '0.15rem' }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
              <strong>Auto-detection disabled.</strong> Set <code>NEXT_PUBLIC_ALCHEMY_KEY</code> in your <code>.env</code> to enable token and NFT scanning. Use the manual inputs below to claim ERC-20s and NFTs on Anvil.
            </p>
          </div>
        )}

        {/* List */}
        {detecting ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-4)', fontSize: '0.82rem', padding: '0.25rem 0' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Scanning vault for assets…
          </div>
        ) : assets.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-4)' }}>No assets detected in this vault.</div>
        ) : (
          <div>
            {assets.map(asset => (
              <AssetRow key={asset.id} asset={asset} onToggle={() => toggle(asset.id)} />
            ))}
          </div>
        )}

        {/* Claim All button */}
        {isUnlocked && (
          <div style={{ marginTop: '1rem' }}>
            {claiming && claimStep && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-4)', marginBottom: '0.6rem' }}>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                {claimStep}
              </div>
            )}
            <button
              className="btn-accent"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              disabled={claiming || checkedCount === 0}
              onClick={handleClaimAll}
            >
              <Zap size={15} />
              {claiming ? 'Claiming…' : `Claim ${checkedCount > 0 ? `${checkedCount} Asset${checkedCount > 1 ? 's' : ''}` : 'Selected'}`}
            </button>
          </div>
        )}

        {!isUnlocked && (
          <div style={{ marginTop: '1rem' }}>
            <button className="btn-secondary" disabled style={{ width: '100%', justifyContent: 'center', opacity: 0.4, cursor: 'not-allowed' }}>
              Claim — Vault Locked
            </button>
          </div>
        )}
      </div>

      {/* ── Manual Claim Fallback (always visible for dev convenience) ── */}
      <div className="card">
        <div className="label" style={{ marginBottom: '0.75rem' }}>Manual Claim</div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Claim individual assets by address. Useful on local Anvil where auto-detection is unavailable.
        </p>

        {/* ERC-20 */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            ERC-20 Token Address
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="input"
              value={manualERC20}
              onChange={e => setManualERC20(e.target.value)}
              placeholder="0x…"
              style={{ flex: 1, fontSize: '0.82rem' }}
            />
            <button
              className="btn-secondary"
              onClick={handleManualERC20}
              disabled={!isUnlocked || !manualERC20.startsWith('0x')}
              style={{ flexShrink: 0, fontSize: '0.8rem' }}
            >
              Claim
            </button>
          </div>
        </div>

        {/* ERC-721 */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            NFT (ERC-721)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              className="input"
              value={manualNFTAddr}
              onChange={e => setManualNFTAddr(e.target.value)}
              placeholder="Contract 0x…"
              style={{ flex: 2, minWidth: 0, fontSize: '0.82rem' }}
            />
            <input
              className="input"
              value={manualNFTId}
              onChange={e => setManualNFTId(e.target.value)}
              placeholder="Token ID"
              style={{ flex: 1, minWidth: '80px', fontSize: '0.82rem' }}
            />
            <button
              className="btn-secondary"
              onClick={handleManualNFT}
              disabled={!isUnlocked || !manualNFTAddr.startsWith('0x') || !manualNFTId}
              style={{ flexShrink: 0, fontSize: '0.8rem' }}
            >
              Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
