"use client";

import { Info } from "lucide-react";

/**
 * Always visible version info on home screen.
 * Use this to identify which build/instance is running
 * (e.g. Cursor AI vs Cursor Terminal - different processes = different timestamps)
 */
export default function VersionInfo() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "?";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="rounded-xl border border-modern-mint/30 bg-modern-mint/10 px-5 py-4 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <Info size={16} className="text-modern-mint-dark flex-shrink-0" />
        <span className="font-semibold text-modern-mint-dark">
          Current Version Info
        </span>
      </div>
      <div className="space-y-0.5 text-gray-700">
        <p>
          <span className="text-gray-500">Version:</span>{" "}
          <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">
            {version}
          </code>
        </p>
        <p>
          <span className="text-gray-500">Started at:</span>{" "}
          <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">
            {buildTime ? formatTime(buildTime) : "—"}
          </code>
        </p>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        If this timestamp differs from your other tab, you&apos;re viewing a
        different server instance.
      </p>
    </div>
  );
}
