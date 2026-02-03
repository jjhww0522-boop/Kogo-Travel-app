"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

declare global {
  interface Window {
    naver?: any;
  }
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };

export interface PlaceForMap {
  name: string;
  lat?: number;
  lng?: number;
}

interface NaverMapCompactProps {
  /** Ordered list of places; markers shown in this order (1, 2, 3...). When empty/undefined, single Seoul marker. */
  places?: PlaceForMap[];
}

export default function NaverMapCompact({ places = [] }: NaverMapCompactProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const placesRef = useRef(places);
  placesRef.current = places;

  const updateMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map || typeof window.naver === "undefined") return;
    const pl = placesRef.current;
    markersRef.current.forEach((m) => {
      try { m.setMap(null); } catch (_) {}
    });
    markersRef.current = [];
    if (!pl || pl.length === 0) {
      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
        map,
        title: "Seoul",
      });
      markersRef.current = [m];
      return;
    }
    const bounds = new window.naver.maps.LatLngBounds();
    pl.forEach((p: PlaceForMap, i: number) => {
      const lat = p.lat ?? SEOUL_CENTER.lat + (i * 0.008);
      const lng = p.lng ?? SEOUL_CENTER.lng + (i * 0.008);
      const pos = new window.naver.maps.LatLng(lat, lng);
      const marker = new window.naver.maps.Marker({
        position: pos,
        map,
        title: `${i + 1}. ${p.name}`,
      });
      markersRef.current.push(marker);
      bounds.extend(pos);
    });
    if (pl.length > 1) {
      try { map.fitBounds(bounds, { padding: 40 }); } catch (_) {}
    }
  };

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId || clientId === "your_client_id_here") return;

    const initMap = () => {
      const el = mapRef.current;
      if (!el || typeof window.naver === "undefined" || mapInstanceRef.current) return;
      try {
        const map = new window.naver.maps.Map(el, {
          center: new window.naver.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
          zoom: 14,
          zoomControl: true,
          zoomControlOptions: { position: window.naver.maps.Position.TOP_RIGHT },
          scaleControl: false,
          mapDataControl: false,
          logoControlOptions: { position: window.naver.maps.Position.BOTTOM_LEFT },
        });
        mapInstanceRef.current = map;
        setTimeout(updateMarkers, 0);
      } catch (err) {
        console.error("Naver Map init failed:", err);
      }
    };

    if (typeof window.naver !== "undefined") {
      setTimeout(initMap, 100);
      return () => {
        markersRef.current = [];
        if (mapInstanceRef.current) {
          try { mapInstanceRef.current.destroy(); } catch (_) {}
          mapInstanceRef.current = null;
        }
      };
    }
    const interval = setInterval(() => {
      if (typeof window.naver !== "undefined") {
        clearInterval(interval);
        setTimeout(initMap, 100);
      }
    }, 200);
    const timeout = setTimeout(() => clearInterval(interval), 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      markersRef.current = [];
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.destroy(); } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when places (or order) changes
  useEffect(() => {
    updateMarkers();
  }, [places]);

  const hasKey = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID &&
    process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID !== "your_client_id_here";

  return (
    <div className="relative z-0 w-full rounded-b-2xl overflow-hidden border-b border-modern-mint/20 bg-surface-muted shadow-sm">
      {hasKey ? (
        <div ref={mapRef} className="w-full h-[180px]" style={{ minHeight: "180px" }} />
      ) : (
        <div className="w-full h-[180px] flex items-center justify-center gap-2">
          <MapPin size={28} className="text-modern-mint/50" />
          <span className="text-sm text-gray-500">Map</span>
        </div>
      )}
    </div>
  );
}
