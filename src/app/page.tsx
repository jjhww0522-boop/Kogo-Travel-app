"use client";

import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TrendingNow from "@/components/TrendingNow";
import NaverMap from "@/components/NaverMap";
import EmergencyFAB from "@/components/EmergencyFAB";
import PlanInputModal from "@/components/PlanInputModal";
import VersionInfo from "@/components/VersionInfo";

export default function Home() {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  return (
    <main className="min-h-screen relative">
      {/* Full-screen fixed map background (behind content) */}
      <div className="fixed inset-0 w-[100vw] h-[100vh] z-[-1]">
        <NaverMap variant="background" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 py-8 pb-28 space-y-10">
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-5 shadow-sm">
          <Header />
        </div>

        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-4 shadow-sm">
          <VersionInfo />
        </div>

        <HeroSection onStartPlanning={() => setIsPlanModalOpen(true)} />

        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-5 shadow-sm">
          <TrendingNow />
        </div>
      </div>

      <EmergencyFAB />
      <PlanInputModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />
    </main>
  );
}
