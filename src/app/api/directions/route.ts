import { NextRequest, NextResponse } from "next/server";
import { getDirections } from "@/lib/naverMap";

/**
 * GET /api/directions?startLat=&startLng=&endLat=&endLng=
 * 두 좌표 간 차량 경로 조회 → duration, distance 반환
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startLat = searchParams.get("startLat");
  const startLng = searchParams.get("startLng");
  const endLat = searchParams.get("endLat");
  const endLng = searchParams.get("endLng");

  if (
    startLat == null ||
    startLng == null ||
    endLat == null ||
    endLng == null
  ) {
    return NextResponse.json(
      { error: "Missing startLat, startLng, endLat, endLng" },
      { status: 400 }
    );
  }

  const lat1 = parseFloat(startLat);
  const lng1 = parseFloat(startLng);
  const lat2 = parseFloat(endLat);
  const lng2 = parseFloat(endLng);

  if (Number.isNaN(lat1) || Number.isNaN(lng1) || Number.isNaN(lat2) || Number.isNaN(lng2)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const result = await getDirections(
      { lat: lat1, lng: lng1 },
      { lat: lat2, lng: lng2 }
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Directions API failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
