"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchExchangeRatesToKRW,
  type ExchangeRatesResult,
  type RateItem,
  type CurrencyCode,
} from "@/lib/exchangeRate";

const CURRENCY_ORDER: CurrencyCode[] = ["USD", "JPY", "EUR", "CNY"];

const CURRENCY_FLAGS: Record<CurrencyCode, string> = {
  USD: "🇺🇸",
  JPY: "🇯🇵",
  EUR: "🇪🇺",
  CNY: "🇨🇳",
};

function formatRate(item: RateItem): string {
  if (item.code === "JPY") {
    const per100 = item.rateToKRW * 100;
    return `₩${Math.round(per100).toLocaleString()}/100`;
  }
  return `₩${Math.round(item.rateToKRW).toLocaleString()}`;
}

function formatLastUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function TrendArrow({ item }: { item: RateItem }) {
  const prev = item.previousRateToKRW;
  if (prev == null) return null;
  const diff = item.rateToKRW - prev;
  if (diff === 0) return null;
  const isUp = diff > 0;
  return (
    <span
      className={`ml-0.5 text-[10px] font-medium ${
        isUp ? "text-red-500" : "text-blue-500"
      }`}
      aria-hidden
    >
      {isUp ? "▲" : "▼"}
    </span>
  );
}

export default function ExchangeRates() {
  const [data, setData] = useState<ExchangeRatesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchExchangeRatesToKRW()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-soft-coral/20 bg-soft-coral/5 px-3 py-2">
        <span className="text-xs text-gray-500">…</span>
      </div>
    );
  }

  const result = data ?? {
    rates: [],
    lastUpdated: new Date().toISOString(),
    isLive: false,
  };

  const rateMap = new Map(result.rates.map((r) => [r.code, r]));
  const currentCode = CURRENCY_ORDER[index] ?? "USD";
  const item = rateMap.get(currentCode);

  const goPrev = () => setIndex((i) => (i - 1 + CURRENCY_ORDER.length) % CURRENCY_ORDER.length);
  const goNext = () => setIndex((i) => (i + 1) % CURRENCY_ORDER.length);

  return (
    <div
      className="rounded-xl border border-soft-coral/20 bg-gradient-to-br from-soft-coral/15 to-soft-coral/5 px-2 py-1.5 flex items-center gap-1 min-w-0 shrink-0"
      title={result.isLive ? `Last updated: ${formatLastUpdated(result.lastUpdated)}` : "Live rate unavailable"}
    >
      <button
        type="button"
        onClick={goPrev}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-soft-coral-dark hover:bg-white transition-colors"
        aria-label="Previous currency"
      >
        <ChevronLeft size={14} />
      </button>

      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center">
        {item ? (
          <>
            <span className="text-lg leading-none shrink-0" aria-hidden>
              {CURRENCY_FLAGS[item.code]}
            </span>
            <span className="text-sm font-semibold text-foreground flex items-center truncate">
              {formatRate(item)}
              <TrendArrow item={item} />
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )}
      </div>

      <button
        type="button"
        onClick={goNext}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-soft-coral-dark hover:bg-white transition-colors"
        aria-label="Next currency"
      >
        <ChevronRight size={14} />
      </button>

      {!result.isLive && (
        <span className="text-[9px] text-amber-600 shrink-0" title="Live rate unavailable">
          !
        </span>
      )}
    </div>
  );
}
