"use client";

/**
 * Example path details (subway exit, bus stop, transfer) for View Path Details accordion.
 * Replace with real routing API data later.
 */
export default function PathDetailsContent() {
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
