"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Accordion component for Path Details (상세 가이드)
 * Extensible structure for future route navigation guides
 * e.g. "Subway Line 2, Exit 3" / "Bus Stop #12345"
 */
interface PathDetailsAccordionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function PathDetailsAccordion({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: PathDetailsAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-modern-mint/20 overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 min-h-[52px] text-left hover:bg-modern-mint/5 active:bg-modern-mint/10 transition-colors touch-manipulation"
      >
        <div className="flex-1 min-w-0 text-left">
          <span className="font-medium text-foreground block">{title}</span>
          {subtitle && (
            <span className="text-sm text-gray-500 block truncate mt-0.5">{subtitle}</span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={22} className="text-modern-mint flex-shrink-0" />
        ) : (
          <ChevronDown size={22} className="text-modern-mint flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-0 border-t border-modern-mint/10">
          <div className="text-sm text-gray-600 pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}
