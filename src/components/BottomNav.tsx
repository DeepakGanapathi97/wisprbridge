"use client";

import React from "react";
import { MessageSquareText, Laptop, Settings } from "lucide-react";

interface BottomNavProps {
  onOpenPairModal: () => void;
  onOpenSettingsModal: () => void;
}

export function BottomNav({ onOpenPairModal, onOpenSettingsModal }: BottomNavProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-6 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Prompts Tab (Active Eloquent style black pill) */}
        <button
          className="flex flex-col items-center gap-1 cursor-pointer"
          title="Prompts Stream"
        >
          <div className="px-4 py-1.5 rounded-full bg-slate-950 text-white transition-all shadow-xs">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-900">Prompts</span>
        </button>

        {/* Pair Device Tab */}
        <button
          onClick={onOpenPairModal}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          title="Pair Laptop / Device"
        >
          <div className="px-3 py-1.5 rounded-full text-slate-500 hover:bg-slate-100 transition-all">
            <Laptop className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-slate-500">Pair Room</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={onOpenSettingsModal}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          title="Settings & TTL"
        >
          <div className="px-3 py-1.5 rounded-full text-slate-500 hover:bg-slate-100 transition-all">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-slate-500">Settings</span>
        </button>
      </div>
    </nav>
  );
}
