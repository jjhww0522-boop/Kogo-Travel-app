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
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-5 py-8 pb-28 space-y-10">
        <Header />

        {/* Always visible - helps identify which server instance is running */}
        <VersionInfo />

        <HeroSection onStartPlanning={() => setIsPlanModalOpen(true)} />

        <NaverMap />

        <TrendingNow />
      </div>

      <EmergencyFAB />
      <PlanInputModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />
    </main>
  );
}
