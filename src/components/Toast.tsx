"use client";

import React from "react";
import { CheckCircle2, Info } from "lucide-react";

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  const isSuccess =
    message.includes("Copied") ||
    message.includes("synced") ||
    message.includes("Connected") ||
    message.includes("Kept");

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950/90 backdrop-blur-md text-white text-xs sm:text-sm font-medium shadow-xl border border-slate-800">
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
