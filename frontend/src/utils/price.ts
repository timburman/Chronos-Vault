const CACHE_KEY = 'cv_prices';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export type PriceMap = Record<string, number>;

export async function fetchPrices(ids: string[]): Promise<PriceMap> {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, ts }: { data: PriceMap; ts: number } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) {
        // Check if all requested ids are cached
        if (ids.every((id) => id in data)) return data;
      }
    }
  } catch {}

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
    const res = await fetch(url);
    const raw = await res.json();
    const data: PriceMap = {};
    for (const id of ids) {
      if (raw[id]?.usd) data[id] = raw[id].usd;
    }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch {}
    return data;
  } catch {
    return {};
  }
}

export async function fetchETHPrice(): Promise<number> {
  const m = await fetchPrices(['ethereum']);
  return m['ethereum'] ?? 0;
}
