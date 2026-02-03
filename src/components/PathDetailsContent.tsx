"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Footprints, Car, type LucideIcon } from "lucide-react";
import type { GuideStep } from "@/lib/naverMap";

/** API 응답 타입 (duration, distance, guide, walkTimeText) */
interface DirectionsDisplay {
  durationText: string;
  distanceText: string;
  walkTimeText?: string;
  guide?: GuideStep[];
}

/** 좌표가 있으면 실시간 경로 API 호출 후 Duration/Distance + 단계별 가이드 표시 */
interface PathDetailsContentProps {
  fromCoord?: { lat: number; lng: number } | null;
  toCoord?: { lat: number; lng: number } | null;
}

function isValidCoord(c: { lat: number; lng: number } | null | undefined): boolean {
  if (!c) return false;
  return Number.isFinite(c.lat) && Number.isFinite(c.lng) && (c.lat !== 0 || c.lng !== 0);
}

function StepIcon({ moveType }: { moveType: "driving" | "walking" }) {
  const Icon: LucideIcon = moveType === "walking" ? Footprints : Car;
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        moveType === "walking" ? "bg-soft-coral/20 text-soft-coral-dark" : "bg-modern-mint/20 text-modern-mint-dark"
      }`}
    >
      <Icon size={16} />
    </span>
  );
}

export default function PathDetailsContent({ fromCoord, toCoord }: PathDetailsContentProps) {
  const [result, setResult] = useState<DirectionsDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCoords = isValidCoord(fromCoord) && isValidCoord(toCoord);

  useEffect(() => {
    if (!hasCoords) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      startLat: String(fromCoord!.lat),
      startLng: String(fromCoord!.lng),
      endLat: String(toCoord!.lat),
      endLng: String(toCoord!.lng),
    });
    fetch(`/api/directions?${params}`)
      .then((res) => {
        if (!res.ok) return res.json().then((body) => Promise.reject(new Error(body?.error ?? res.statusText)));
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setResult({
            durationText: data.durationText,
            distanceText: data.distanceText,
            walkTimeText: data.walkTimeText,
            guide: data.guide,
          });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load route");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasCoords, fromCoord?.lat, fromCoord?.lng, toCoord?.lat, toCoord?.lng]);

  if (hasCoords) {
    return (
      <div className="space-y-3 text-sm">
        {loading && (
          <p className="text-gray-500">Loading route...</p>
        )}
        {error && (
          <div className="rounded-lg bg-soft-coral/10 border border-soft-coral/20 p-3 text-soft-coral-dark">
            {error}
          </div>
        )}
        {result && !loading && (
          <>
            <div className="flex flex-wrap gap-3 rounded-lg bg-modern-mint/10 border border-modern-mint/20 p-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-modern-mint shrink-0" />
                <span className="font-medium text-foreground">{result.durationText}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-modern-mint shrink-0" />
                <span className="font-medium text-foreground">{result.distanceText}</span>
              </div>
              {result.walkTimeText && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Footprints size={18} className="shrink-0" />
                  <span>{result.walkTimeText}</span>
                </div>
              )}
            </div>

            {result.guide && result.guide.length > 0 && (
              <div className="rounded-lg border border-modern-mint/20 bg-white p-4">
                <p className="font-medium text-foreground mb-3">Step-by-step guide</p>
                <ul className="space-y-3">
                  {result.guide.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <StepIcon moveType={step.moveType} />
                      <div className="min-w-0 flex-1 pt-0.5">
                        {step.segments.map((seg, j) =>
                          seg.highlight ? (
                            <strong key={j} className="text-modern-mint-dark font-semibold">
                              {seg.text}
                            </strong>
                          ) : (
                            <span key={j}>{seg.text}</span>
                          )
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg bg-modern-mint/5 border border-modern-mint/20 p-4">
              <p className="font-medium text-modern-mint-dark mb-1">Subway</p>
              <ul className="text-gray-700 space-y-0.5">
                <li>• Line 2 (Green) → Get off at City Hall Station</li>
                <li>• Use <strong>Exit 3</strong> for shortest walk</li>
              </ul>
            </div>
            <div className="rounded-lg bg-soft-coral/10 border border-soft-coral/20 p-4">
              <p className="font-medium text-soft-coral-dark mb-1">Bus</p>
              <ul className="text-gray-700 space-y-0.5">
                <li>• Stop ID: <strong>01-234</strong></li>
                <li>• Bus 405, 501, 506 — &quot;City Hall&quot; stop</li>
              </ul>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg bg-modern-mint/10 border border-modern-mint/20 p-4">
        <p className="font-medium text-modern-mint-dark mb-1">Subway</p>
        <ul className="text-gray-700 space-y-0.5">
          <li>• Line 2 (Green) → Get off at City Hall Station</li>
          <li>• Use <strong>Exit 3</strong> for shortest walk</li>
        </ul>
      </div>
      <div className="rounded-lg bg-soft-coral/10 border border-soft-coral/20 p-4">
        <p className="font-medium text-soft-coral-dark mb-1">Bus</p>
        <ul className="text-gray-700 space-y-0.5">
          <li>• Stop ID: <strong>01-234</strong></li>
          <li>• Bus 405, 501, 506 — &quot;City Hall&quot; stop</li>
        </ul>
      </div>
      <div className="rounded-lg bg-modern-mint/10 border border-modern-mint/20 p-4">
        <p className="font-medium text-modern-mint-dark mb-1">Transfer tip</p>
        <p className="text-gray-700">
          For faster transfer at City Hall Station, move to <strong>Car 3–4</strong> (center of platform).
        </p>
      </div>
    </div>
  );
}
