"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Bookmark, Settings } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/my-plans", icon: MapPin, label: "My Plans" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-modern-mint/20 bg-white/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(94,179,166,0.08)]">
      <div className="flex h-16 items-center justify-around max-w-lg mx-auto px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all duration-200 rounded-xl ${
                isActive
                  ? "text-modern-mint-dark font-medium"
                  : "text-gray-500 hover:text-modern-mint"
              }`}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-modern-mint-dark" : ""}
              />
              <span className="text-xs mt-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
