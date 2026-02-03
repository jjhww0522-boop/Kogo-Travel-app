"use client";

import { Sparkles } from "lucide-react";

interface HeroSectionProps {
  onStartPlanning: () => void;
}

export default function HeroSection({ onStartPlanning }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl backdrop-blur-sm bg-gradient-to-br from-modern-mint/85 via-modern-mint-light/85 to-modern-mint-dark/85 p-10 text-white shadow-lg">
      <div className="absolute top-4 right-4 opacity-20">
        <Sparkles size={48} />
      </div>
      <div className="relative">
        <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
          Plan Your Perfect Seoul Trip with AI
        </h2>
        <p className="text-white/90 text-sm mb-6 max-w-md">
          Get precise directions with subway exits, bus stop numbers, and local
          tips—all in English.
        </p>
        <button
          onClick={onStartPlanning}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-modern-mint-dark font-semibold rounded-xl hover:bg-white/95 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          Start Planning
        </button>
      </div>
    </section>
  );
}
