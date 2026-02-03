"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window {
    naver?: any;
  }
}

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 };

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    if (!clientId || clientId === "your_client_id_here") {
      return;
    }

    const initMap = () => {
      const el = mapRef.current;
      if (!el || typeof window.naver === "undefined") return;
      if (mapInstanceRef.current) return;

      try {
        const map = new window.naver.maps.Map(el, {
          center: new window.naver.maps.LatLng(
            SEOUL_CITY_HALL.lat,
            SEOUL_CITY_HALL.lng
          ),
          zoom: 15,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT,
          },
          scaleControl: true,
          mapDataControl: false,
          logoControlOptions: {
            position: window.naver.maps.Position.BOTTOM_LEFT,
          },
        });

        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(
            SEOUL_CITY_HALL.lat,
            SEOUL_CITY_HALL.lng
          ),
          map,
          title: "Seoul City Hall",
        });

        mapInstanceRef.current = map;
      } catch (err) {
        console.error("Naver Map initialization failed:", err);
      }
    };

    // Script is loaded from layout (NaverMapScript) - wait for window.naver
    const tryInit = () => {
      if (typeof window.naver !== "undefined") {
        requestAnimationFrame(() => setTimeout(initMap, 150));
        return true;
      }
      return false;
    };

    if (tryInit()) return;

    const interval = setInterval(() => {
      if (tryInit()) clearInterval(interval);
    }, 200);

    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const hasValidKey = clientId && clientId !== "your_client_id_here";

  return (
    <section className="relative z-0">
      <div className="flex items-center gap-2 mb-5">
        <MapPin size={22} className="text-modern-mint-dark" />
        <h3 className="text-lg font-bold text-foreground">Seoul Map</h3>
      </div>
      <div className="rounded-2xl overflow-hidden border border-modern-mint/20 shadow-md min-h-[256px] relative z-0">
        {hasValidKey ? (
          <div
            ref={mapRef}
            className="w-full h-64 bg-surface-muted relative z-0"
            style={{ minHeight: "256px", width: "100%" }}
          />
        ) : (
          <div className="w-full h-64 bg-surface-muted flex flex-col items-center justify-center gap-3 p-6">
            <MapPin size={48} className="text-modern-mint/50" />
            <p className="text-center text-gray-600 text-sm">
              Add your Naver Map Client ID to .env.local to display the map.
            </p>
            <p className="text-center text-gray-500 text-xs">
              NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
