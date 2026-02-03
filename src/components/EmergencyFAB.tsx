"use client";

import { useState } from "react";
import { PhoneCall, X, Copy, Check } from "lucide-react";

const SAMPLE_KOREAN_MESSAGE = `여기로 가주세요.
(Please take me here)

주소: 서울특별시 중구 세종대로 110
(Address: 110 Sejong-daero, Jung-gu, Seoul)`;

export default function EmergencyFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_KOREAN_MESSAGE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Copy failed");
    }
  };

  return (
    <>
      <div className="fixed bottom-20 right-5 z-[100] flex flex-col items-center gap-1">
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-soft-coral text-white shadow-lg hover:bg-soft-coral-dark transition-all hover:scale-105 active:scale-95"
          aria-label="Emergency Help"
        >
          <PhoneCall size={24} />
        </button>
        <span className="text-[10px] font-medium text-gray-500">Help</span>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  Emergency Help
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Show this to your taxi driver or when you need help:
              </p>
              <div className="rounded-2xl bg-surface-muted p-4 font-mono text-sm whitespace-pre-wrap mb-4 border border-modern-mint/20">
                {SAMPLE_KOREAN_MESSAGE}
              </div>
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-modern-mint text-white font-medium hover:bg-modern-mint-dark transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
