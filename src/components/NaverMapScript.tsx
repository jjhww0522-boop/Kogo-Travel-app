"use client";

import Script from "next/script";

/**
 * Map UI language for the script. Default: English.
 * To make user-configurable: load script dynamically based on settings (e.g. kogo_map_lang in localStorage) and re-mount when lang changes.
 */
const MAP_LANG = "en";

/**
 * Load Naver Map API script from layout so Referer is correct (localhost:3000).
 * Helps avoid "인증 실패" when Web Service URL includes port.
 * &lang=en: place names and map UI in English.
 */
export default function NaverMapScript() {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  if (!clientId || clientId === "your_client_id_here") return null;

  const scriptUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&ncpClientId=${clientId}&lang=${MAP_LANG}`;
  return (
    <Script
      src={scriptUrl}
      strategy="afterInteractive"
    />
  );
}
