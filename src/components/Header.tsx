"use client";

import React from "react";
import { Sparkles, Laptop, Link2, Copy, Check, Settings, LogOut } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  pairCode: string;
  autoCopyEnabled: boolean;
  hasPendingAutoCopy?: boolean;
  onToggleAutoCopy: () => void;
  onOpenPairModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuthModal?: () => void;
  userEmail?: string | null;
  onSignOut: () => void;
  onLeaveRoom: () => void;
  isSupabaseConfigured: boolean;
}

export function Header({
  pairCode,
  autoCopyEnabled,
  hasPendingAutoCopy,
  onToggleAutoCopy,
  onOpenPairModal,
  onOpenSettingsModal,
  userEmail,
  onSignOut,
  onLeaveRoom,
  isSupabaseConfigured,
}: HeaderProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pairCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <header className="pt-6 pb-4 px-4 sm:px-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Brand Identity + Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-none">
            WisprBridge
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">
            WisprFlow / Eloquent on one device — syncs live with the others
          </p>
        </div>

        {/* Right: Consolidated Controls (Single Clean Row) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
          {/* Pair Room Button */}
          <button
            onClick={onOpenPairModal}
            title="Open Pair Room & Device Join Dialog"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/90 shadow-2xs transition-all cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Pair Room</span>
          </button>

          {/* Active Room Code Pill with Copy */}
          {pairCode && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500">Room:</span>
              <span className="font-mono font-bold tracking-wider text-slate-900">
                {pairCode}
              </span>
              <button
                onClick={copyCode}
                className="ml-0.5 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Copy Room Code"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* Auto-Copy Toggle Switch */}
          <button
            onClick={onToggleAutoCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer shadow-2xs ${
              autoCopyEnabled
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            title="Automatically copies incoming prompts to laptop clipboard when browser tab is active"
          >
            <Laptop className={`w-3.5 h-3.5 ${autoCopyEnabled ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Auto-Copy:</span>
            <span className={`font-semibold ${autoCopyEnabled ? "text-emerald-700" : "text-slate-500"}`}>
              {autoCopyEnabled ? "ON" : "OFF"}
            </span>
          </button>

          {/* Pending Auto-Copy Pill if Window is waiting for focus click */}
          {hasPendingAutoCopy && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse shadow-2xs"
              title="Click anywhere in this window to copy pending prompt to clipboard"
            >
              ⚡ Click window to copy
            </span>
          )}

          {/* Authenticated User Account Chip */}
          {userEmail && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              <span className="truncate max-w-[120px] font-medium" title={userEmail}>
                {userEmail}
              </span>
              <button
                onClick={onSignOut}
                title="Sign out of your account"
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Settings Button (Only if authenticated) */}
          {userEmail && (
            <button
              onClick={onOpenSettingsModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              title="Settings & 1-Hour Self-Destruct rules"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Settings</span>
            </button>
          )}

          {/* Leave Room Button */}
          {pairCode && (
            <button
              onClick={onLeaveRoom}
              title="Leave this room and return to gateway"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-2xs transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span>Leave Room</span>
            </button>
          )}
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
          <span>
            💡 <strong>Demo Mode</strong>: Supabase credentials not set yet. Running with instant local pairing & storage.
          </span>
        </div>
      )}
    </header>
  );
}
