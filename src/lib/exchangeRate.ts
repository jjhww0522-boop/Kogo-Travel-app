/**
 * Exchange rate fetching via Frankfurter API (free, no key required)
 * https://www.frankfurter.app/docs/
 */

const API_BASE = "https://api.frankfurter.dev/v1";

export type CurrencyCode = "USD" | "JPY" | "EUR" | "CNY";

export interface RateItem {
  code: CurrencyCode;
  rateToKRW: number; // 1 unit of currency = rateToKRW KRW (JPY: per 1 JPY)
  previousRateToKRW?: number; // for ▲▼ comparison
}

export interface ExchangeRatesResult {
  rates: RateItem[];
  lastUpdated: string; // ISO date
  isLive: boolean; // false when API failed and using fallback
}

const CURRENCIES: CurrencyCode[] = ["USD", "JPY", "EUR", "CNY"];

// Fallback when API fails (approximate rates)
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1350,
  JPY: 9, // 1 JPY ≈ 9 KRW → 100 JPY ≈ 900 KRW
  EUR: 1450,
  CNY: 185,
};

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function fetchRateFromFrankfurter(
  from: CurrencyCode,
  date?: string
): Promise<number | null> {
  const path = date ? `${API_BASE}/${date}` : `${API_BASE}/latest`;
  const params = new URLSearchParams({ base: from, symbols: "KRW" });
  const url = `${path}?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: { KRW?: number } };
    return data.rates?.KRW ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches USD, JPY, EUR, CNY → KRW rates and optional previous day for ▲▼
 */
export async function fetchExchangeRatesToKRW(): Promise<ExchangeRatesResult> {
  const yesterday = getYesterdayDate();

  try {
    const [latestPromises, previousPromises] = [
      CURRENCIES.map((code) => fetchRateFromFrankfurter(code)),
      CURRENCIES.map((code) => fetchRateFromFrankfurter(code, yesterday)),
    ];

    const [latestResults, previousResults] = await Promise.all([
      Promise.all(latestPromises),
      Promise.all(previousPromises),
    ]);

    const allLatestOk = latestResults.every((r) => r != null);
    if (!allLatestOk) throw new Error("Incomplete rates");

    const rates: RateItem[] = CURRENCIES.map((code, i) => ({
      code,
      rateToKRW: latestResults[i]!,
      previousRateToKRW: previousResults[i] ?? undefined,
    }));

    return {
      rates,
      lastUpdated: new Date().toISOString(),
      isLive: true,
    };
  } catch {
    return {
      rates: CURRENCIES.map((code) => ({
        code,
        rateToKRW: FALLBACK_RATES[code],
        previousRateToKRW: undefined,
      })),
      lastUpdated: new Date().toISOString(),
      isLive: false,
    };
  }
}
