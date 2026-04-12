/**
 * Alchemy API integration for token and NFT auto-detection.
 * Set NEXT_PUBLIC_ALCHEMY_KEY in your .env file.
 */

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || '';
const BASE_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string; // hex
}

export interface TokenMetadata {
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  logo: string | null;
}

export interface AlchemyNFT {
  contract: { address: string; name?: string; symbol?: string };
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155';
  name?: string;
  description?: string;
  image?: { cachedUrl?: string; thumbnailUrl?: string; originalUrl?: string };
  balance?: string; // for ERC-1155
}

export interface AssetTransfer {
  category: 'external' | 'erc20' | 'erc721' | 'erc1155' | 'internal';
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  hash: string;
  blockNum: string;
  metadata: { blockTimestamp: string };
  tokenId?: string;
  erc721TokenId?: string;
  erc1155Metadata?: Array<{ tokenId: string; value: string }>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function alchemyPost(method: string, params: unknown[]) {
  if (!ALCHEMY_KEY) {
    console.warn('[Alchemy] No API key set (NEXT_PUBLIC_ALCHEMY_KEY)');
    return null;
  }
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const json = await res.json();
    return json.result ?? null;
  } catch (err) {
    console.error(`[Alchemy] ${method} failed:`, err);
    return null;
  }
}

async function alchemyGet(path: string) {
  if (!ALCHEMY_KEY) return null;
  try {
    const res = await fetch(`${BASE_URL}/${path}`);
    return await res.json();
  } catch (err) {
    console.error(`[Alchemy] GET ${path} failed:`, err);
    return null;
  }
}

// ─── ERC-20 Token Detection ────────────────────────────────────────────────

/**
 * Fetch all ERC-20 token balances held by an address.
 * Returns non-zero balances only.
 */
export async function fetchTokenBalances(address: string): Promise<AlchemyTokenBalance[]> {
  const result = await alchemyPost('alchemy_getTokenBalances', [address, 'erc20']);
  if (!result?.tokenBalances) return [];
  return (result.tokenBalances as AlchemyTokenBalance[]).filter(
    (t) => t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000' && t.tokenBalance !== '0x0'
  );
}

/**
 * Fetch metadata (name, symbol, decimals, logo) for a token contract.
 */
export async function fetchTokenMetadata(tokenAddress: string): Promise<TokenMetadata | null> {
  const result = await alchemyPost('alchemy_getTokenMetadata', [tokenAddress]);
  return result as TokenMetadata | null;
}

/**
 * Auto-detect all ERC-20 tokens, with resolved metadata.
 */
export async function autoDetectTokens(vaultAddress: string) {
  const balances = await fetchTokenBalances(vaultAddress);
  if (balances.length === 0) return [];

  const detectedTokens = await Promise.all(
    balances.map(async (b) => {
      const meta = await fetchTokenMetadata(b.contractAddress);
      return {
        address: b.contractAddress as `0x${string}`,
        symbol: meta?.symbol || '???',
        name: meta?.name || 'Unknown Token',
        decimals: meta?.decimals ?? 18,
        logo: meta?.logo || null,
        rawBalance: b.tokenBalance,
      };
    })
  );

  return detectedTokens;
}

// ─── NFT Detection ─────────────────────────────────────────────────────────

/**
 * Fetch all NFTs held by an address using Alchemy's getNFTsForOwner.
 */
export async function fetchNFTs(ownerAddress: string): Promise<AlchemyNFT[]> {
  const result = await alchemyGet(`getNFTsForOwner?owner=${ownerAddress}&withMetadata=true`);
  if (!result?.ownedNfts) return [];
  return result.ownedNfts as AlchemyNFT[];
}

// ─── Transaction History ───────────────────────────────────────────────────

/**
 * Fetch all asset transfers to/from a vault address.
 */
export async function fetchVaultTransfers(vaultAddress: string): Promise<{
  incoming: AssetTransfer[];
  outgoing: AssetTransfer[];
}> {
  const [inbound, outbound] = await Promise.all([
    alchemyPost('alchemy_getAssetTransfers', [{
      fromBlock: '0x0',
      toAddress: vaultAddress,
      category: ['external', 'erc20', 'erc721', 'erc1155'],
      withMetadata: true,
      order: 'desc',
      maxCount: '0x64', // 100
    }]),
    alchemyPost('alchemy_getAssetTransfers', [{
      fromBlock: '0x0',
      fromAddress: vaultAddress,
      category: ['external', 'erc20', 'erc721', 'erc1155'],
      withMetadata: true,
      order: 'desc',
      maxCount: '0x64',
    }]),
  ]);

  return {
    incoming: (inbound?.transfers as AssetTransfer[]) || [],
    outgoing: (outbound?.transfers as AssetTransfer[]) || [],
  };
}

/**
 * Check if Alchemy is available (key is configured).
 */
export function isAlchemyAvailable(): boolean {
  return !!ALCHEMY_KEY;
}
