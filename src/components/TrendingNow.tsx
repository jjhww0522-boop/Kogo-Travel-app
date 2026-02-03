"use client";

import { TrendingUp, MapPin } from "lucide-react";

const trendingItems = [
  {
    id: 1,
    title: "Seongsu-dong Pop-up Stores",
    description: "Hip cafes & indie boutiques—the Brooklyn of Seoul",
    tag: "Local Favorite",
    color: "from-soft-coral/30 to-soft-coral/10",
    borderColor: "border-soft-coral/30",
  },
  {
    id: 2,
    title: "Hongdae Street Performers",
    description: "Live music & arts every weekend evening",
    tag: "Free Fun",
    color: "from-modern-mint/30 to-modern-mint/10",
    borderColor: "border-modern-mint/30",
  },
  {
    id: 3,
    title: "Gwangjang Market Night Bazaar",
    description: "Authentic street food & vintage finds",
    tag: "Foodie Paradise",
    color: "from-soft-coral/30 to-soft-coral/10",
    borderColor: "border-soft-coral/30",
  },
];

export default function TrendingNow() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp size={22} className="text-modern-mint-dark" />
        <h3 className="text-lg font-bold text-foreground">Trending Now</h3>
      </div>
      <p className="text-sm text-gray-600 mb-5">
        What&apos;s hot in Korean local communities
      </p>
      <div className="space-y-4">
        {trendingItems.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl bg-gradient-to-br ${item.color} p-5 border ${item.borderColor} hover:shadow-md transition-shadow cursor-pointer`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="inline-block text-xs font-medium text-modern-mint-dark bg-white/80 px-2 py-0.5 rounded-full mb-2">
                  {item.tag}
                </span>
                <h4 className="font-semibold text-foreground mb-1">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {item.description}
                </p>
              </div>
              <MapPin
                size={20}
                className="text-modern-mint flex-shrink-0 mt-1 opacity-70"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
