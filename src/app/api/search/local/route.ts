/**
 * GET /api/search/local?query=검색어
 * 네이버 지역 검색 API를 호출하고, mapx/mapy를 WGS84(lat,lng)로 변환해 반환합니다.
 */

import { NextRequest } from "next/server";
import { searchLocal } from "@/lib/naverMap";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  if (!query || typeof query !== "string") {
    return Response.json({ items: [] }, { status: 200 });
  }

  try {
    const items = await searchLocal(query);
    return Response.json({ items });
  } catch (e) {
    console.error("[search/local]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
