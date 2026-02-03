"use client";

import { Cloud } from "lucide-react";
import ExchangeRates from "./ExchangeRates";

export default function Header() {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Welcome back,</p>
          <h1 className="text-xl font-bold text-foreground">Traveler</h1>
        </div>
        <ExchangeRates />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white/60 backdrop-blur-sm bg-gradient-to-br from-modern-mint/20 to-modern-mint/5 p-5 border border-modern-mint/20">
          <div className="flex items-center gap-2 mb-2">
            <Cloud size={20} className="text-modern-mint-dark" />
            <span className="text-sm font-medium text-gray-700">Seoul Weather</span>
          </div>
          <p className="text-lg font-semibold text-foreground">15°C Sunny</p>
          <p className="text-xs text-gray-600 mt-1">
            Light jacket recommended. Perfect for exploring!
          </p>
        </div>
      </div>
    </header>
  );
}
