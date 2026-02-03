/**
 * Naver Directions 5 API (driving) – 두 지점 간 차량 경로 조회
 * .env.local: NEXT_PUBLIC_NAVER_MAP_CLIENT_ID, NAVER_MAP_CLIENT_SECRET (서버 전용)
 * API 키는 서버(API Route)에서만 사용하세요.
 */

export interface DirectionsCoord {
  lat: number;
  lng: number;
}

/** 단계별 가이드 한 항목 (영문 + 키워드 강조 세그먼트, 이동 타입) */
export interface GuideStep {
  /** 영어로 번역·가공된 문장 */
  instructionEn: string;
  /** 강조할 부분을 나눈 세그먼트 (highlight: true면 Exit 8, Bus Stop #02123 등) */
  segments: { text: string; highlight: boolean }[];
  /** traoptimal 데이터 기반: Driving / Walking 아이콘 매칭 */
  moveType: "driving" | "walking";
}

export interface DirectionsResult {
  /** 이동 시간(초) */
  duration: number;
  /** 거리(미터) */
  distance: number;
  /** 표시용 예: "약 15분" */
  durationText: string;
  /** 표시용 예: "3.2 km" */
  distanceText: string;
  /** 도보 시간 환산 예: "~15 min walk" (거리 기반) */
  walkTimeText?: string;
  /** 단계별 경로 안내 (guide 섹션 추출 → 번역·키워드 강조) */
  guide?: GuideStep[];
}

const DIRECTIONS_BASE = "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving";

/**
 * 두 좌표 사이 차량 경로 조회 (Directions 5 API)
 * @param start 출발지 { lat, lng }
 * @param end 도착지 { lat, lng }
 * @returns duration, distance, durationText, distanceText, walkTimeText, guide[]
 */
export async function getDirections(
  start: DirectionsCoord,
  end: DirectionsCoord
): Promise<DirectionsResult> {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing NAVER credentials. Set NEXT_PUBLIC_NAVER_MAP_CLIENT_ID and NAVER_MAP_CLIENT_SECRET in .env.local"
    );
  }

  const startStr = `${start.lng},${start.lat}`;
  const goalStr = `${end.lng},${end.lat}`;
  const url = `${DIRECTIONS_BASE}?start=${encodeURIComponent(startStr)}&goal=${encodeURIComponent(goalStr)}`;

  // Application(KoGo) 인증 정보: X-Naver-Client-Id / X-Naver-Client-Secret 사용
  // (API Gateway용 X-NCP-APIGW-* 가 401 나오면 이 헤더로 시도)
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Directions API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as NaverDirectionsResponse;
  return parseDirectionsResponse(data);
}

/** API 응답 구조 (guide 섹션 포함) */
interface NaverDirectionsResponse {
  route?: {
    traoptimal?: Array<{
      summary?: { duration?: number; distance?: number };
      guide?: Array<{
        instructions?: string;
        instruction?: string;
        type?: number;
        pathType?: number;
        distance?: number;
        duration?: number;
      }>;
      section?: Array<{ guide?: Array<{ instructions?: string; instruction?: string; type?: number }> }>;
    }>;
    optimal?: Array<{ summary?: { duration?: number; distance?: number }; guide?: Array<{ instructions?: string; type?: number }> }>;
  };
  duration?: number;
  distance?: number;
  result?: { route?: { traoptimal?: Array<{ summary?: { duration?: number; distance?: number }; guide?: unknown[] }> } };
}

function parseDirectionsResponse(data: NaverDirectionsResponse): DirectionsResult {
  let durationMs = 0;
  let distanceM = 0;
  let rawGuide: Array<{ instructions?: string; instruction?: string; type?: number; pathType?: number }> = [];

  const tra = data.route?.traoptimal?.[0] ?? data.route?.optimal?.[0] ?? data.result?.route?.traoptimal?.[0];
  if (tra?.summary) {
    durationMs = tra.summary.duration ?? 0;
    distanceM = tra.summary.distance ?? 0;
  }
  if ((durationMs === 0 || distanceM === 0) && typeof data.duration === "number" && typeof data.distance === "number") {
    durationMs = data.duration;
    distanceM = data.distance;
  }

  if (tra && "guide" in tra && Array.isArray(tra.guide)) {
    rawGuide = tra.guide.map((g) => ({
      instructions: (g as { instructions?: string }).instructions ?? (g as { instruction?: string }).instruction,
      instruction: (g as { instruction?: string }).instruction ?? (g as { instructions?: string }).instructions,
      type: (g as { type?: number }).type,
      pathType: (g as { pathType?: number }).pathType,
    }));
  }
  const sectionGuide = tra && "section" in tra && Array.isArray((tra as { section?: unknown[] }).section)
    ? (tra as { section: Array<{ guide?: Array<{ instructions?: string; instruction?: string; type?: number }> }> }).section.flatMap((s) => s.guide ?? [])
    : [];
  if (rawGuide.length === 0 && sectionGuide.length > 0) {
    rawGuide = sectionGuide.map((g) => ({ instructions: g.instructions ?? g.instruction, instruction: g.instruction ?? g.instructions, type: g.type }));
  }

  const durationSec = Math.round(durationMs / 1000);
  const durationText = formatDuration(durationSec);
  const distanceText = formatDistance(distanceM);
  const walkTimeText = getWalkTimeText(distanceM);
  const guide = rawGuide.length > 0 ? rawGuide.map((g, i) => buildGuideStep(g, i)) : undefined;

  return {
    duration: durationSec,
    distance: distanceM,
    durationText,
    distanceText,
    walkTimeText,
    guide,
  };
}

/** 도보 시간 환산: 5km/h 기준 (1.2km → ~15 min walk) */
function getWalkTimeText(meters: number): string {
  if (meters <= 0) return "";
  const km = meters / 1000;
  if (km > 5) return ""; // 5km 초과면 도보 안내 생략
  const walkMin = Math.round((km / 5) * 60);
  if (walkMin < 1) return "~1 min walk";
  return `~${walkMin} min walk`;
}

/** type/pathType → driving | walking (0 또는 없음 = driving, 1 = walking) */
function getMoveType(g: { type?: number; pathType?: number }, index: number): "driving" | "walking" {
  const t = g.type ?? g.pathType;
  if (t === 1) return "walking";
  return "driving";
}

function buildGuideStep(
  g: { instructions?: string; instruction?: string; type?: number; pathType?: number },
  index: number
): GuideStep {
  const raw = (g.instructions ?? g.instruction ?? "").trim() || "Continue.";
  const en = translateGuideToEnglish(raw);
  const segments = highlightKeywords(en);
  return {
    instructionEn: en,
    segments,
    moveType: getMoveType(g, index),
  };
}

/** 한국어 가이드 문장을 영어로 번역 (공통 표현 사전 + 키워드 패턴 유지) */
function translateGuideToEnglish(text: string): string {
  if (!text) return "Continue.";
  const hasKorean = /[\uAC00-\uD7A3]/.test(text);

  if (!hasKorean) return text;

  const dict: [RegExp | string, string][] = [
    ["출발", "Depart"],
    ["도착", "Arrive"],
    ["직진", "Go straight"],
    ["우회전", "Turn right"],
    ["좌회전", "Turn left"],
    ["유턴", "Make a U-turn"],
    ["진입", "Enter"],
    ["종료", "End"],
    ["오른쪽", "right"],
    ["왼쪽", "left"],
    ["정류장", "Bus Stop"],
    ["정류소", "Bus Stop"],
    ["출구", "Exit"],
    ["역", "Station"],
    ["지하철", "Subway"],
    ["버스", "Bus"],
    ["도보", "Walk"],
    ["이동", "Go"],
    ["약 ", "About "],
    ["미터", "m"],
    ["킬로", "km"],
  ];

  let out = text;
  for (const [from, to] of dict) {
    out = typeof from === "string" ? out.split(from).join(to) : out.replace(from, to);
  }

  // 출구 8 → Exit 8, 정류장 02123 → Bus Stop #02123
  out = out.replace(/(?:출구|Exit)\s*(\d+)/gi, "Exit $1");
  out = out.replace(/(?:정류장|Bus Stop)\s*[#]?(\d+)/gi, "Bus Stop #$1");
  out = out.replace(/(?:버스|Bus)\s*(\d+)/gi, "Bus #$1");

  return out.trim() || text;
}

const HIGHLIGHT_PATTERN = /\b(Exit\s*\d+|Bus\s*Stop\s*#?\d+|Bus\s*#?\d+|Station\s*\d*|#\d+)/gi;

/** 키워드 강조용 세그먼트 분할 (Exit N, Bus Stop #N, Bus #N 등) */
function highlightKeywords(text: string): { text: string; highlight: boolean }[] {
  const parts: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  HIGHLIGHT_PATTERN.lastIndex = 0;
  while ((m = HIGHLIGHT_PATTERN.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, m.index), highlight: false });
    }
    parts.push({ text: m[0], highlight: true });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }
  return parts.length > 0 ? parts : [{ text, highlight: false }];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return "Under 1 min";
  const min = Math.round(seconds / 60);
  if (min < 60) return `About ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `About ${h}h ${m}min` : `About ${h}h`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}

// ---------------------------------------------------------------------------
// TM128 (Naver Local Search mapx, mapy) → WGS84 (lat, lng) 변환
// 네이버 지역 검색 API는 mapx, mapy를 TM128 또는 유사 좌표계로 반환함.
// Bessel 타원체, 중앙경선 128°, 위도원점 38°, FE=400000, FN=600000, k=0.9999
// ---------------------------------------------------------------------------

export function tm128ToWgs84(mapx: number, mapy: number): { lat: number; lng: number } {
  const a = 6377397.155;
  const f = 1 / 299.1528128;
  const e2 = 2 * f - f * f;
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const lat0 = (38 * Math.PI) / 180;
  const lon0 = (128 * Math.PI) / 180;
  const k0 = 0.9999;
  const falseEasting = 400000;
  const falseNorthing = 600000;

  const x = (mapx - falseEasting) / k0;
  const y = (mapy - falseNorthing) / k0;

  const M = y;
  const mu = M / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 * e1 * e1) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 * e1 * e1 * e1) / 32) * Math.sin(4 * mu);

  const C1 = (e2 * Math.cos(phi1) * Math.cos(phi1)) / (1 - e2);
  const T1 = Math.tan(phi1) * Math.tan(phi1);
  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1));
  const R1 = (a * (1 - e2)) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 1.5);
  const D = x / N1;

  const latRad =
    phi1 -
    (N1 * Math.tan(phi1) / R1) *
      (D * D / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1) * D * D * D * D) / 24);
  const lngRad = lon0 + (D - ((1 + 2 * T1 + C1) * D * D * D) / 6) / Math.cos(phi1);

  return {
    lat: (latRad * 180) / Math.PI,
    lng: (lngRad * 180) / Math.PI,
  };
}

/** 지역 검색 API 한 건 (title + WGS84 좌표) */
export interface LocalSearchItem {
  title: string;
  mapx: number;
  mapy: number;
  lat: number;
  lng: number;
  address?: string;
  roadAddress?: string;
}

const SEARCH_LOCAL_BASE = "https://openapi.naver.com/v1/search/local.json";

/**
 * 네이버 지역 검색 API 호출 후 TM128 → WGS84 변환하여 반환
 */
export async function searchLocal(query: string): Promise<LocalSearchItem[]> {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing NAVER credentials. Set NEXT_PUBLIC_NAVER_MAP_CLIENT_ID and NAVER_MAP_CLIENT_SECRET in .env.local"
    );
  }

  const q = query.trim();
  if (!q) return [];

  const url = `${SEARCH_LOCAL_BASE}?query=${encodeURIComponent(q)}&display=5&start=1&sort=random`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Naver Local Search API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { items?: Array<{ title?: string; mapx?: string; mapy?: string; address?: string; roadAddress?: string }> };
  const items = data.items ?? [];

  return items
    .filter((i) => i.mapx != null && i.mapy != null)
    .map((i) => {
      const mapx = Number(i.mapx);
      const mapy = Number(i.mapy);
      const { lat, lng } = tm128ToWgs84(mapx, mapy);
      return {
        title: (i.title ?? "").replace(/<[^>]*>/g, "").trim(),
        mapx,
        mapy,
        lat,
        lng,
        address: i.address?.replace(/<[^>]*>/g, "").trim(),
        roadAddress: i.roadAddress?.replace(/<[^>]*>/g, "").trim(),
      };
    });
}
