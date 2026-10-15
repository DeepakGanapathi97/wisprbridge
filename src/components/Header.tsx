"use client";

import React from "react";
import { Cloud, CloudOff, Sparkles, Laptop, Link2, Copy, Check, Settings, LogIn, LogOut, LogOutIcon } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  pairCode: string;
  autoCopyEnabled: boolean;
  onToggleAutoCopy: () => void;
  onOpenPairModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuthModal: () => void;
  userEmail?: string | null;
  onSignOut: () => void;
  onLeaveRoom: () => void;
  isSupabaseConfigured: boolean;
}

export function Header({
  isConnected,
  pairCode,
  autoCopyEnabled,
  onToggleAutoCopy,
  onOpenPairModal,
  onOpenSettingsModal,
  onOpenAuthModal,
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
      <div className="flex items-center justify-between gap-3">
        {/* Brand Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              WisprBridge
            </h1>
          </div>
        </div>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* User Account / Sign In Pill */}
          {userEmail ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              <span className="truncate max-w-[120px] sm:max-w-[160px] font-medium" title={userEmail}>
                {userEmail}
              </span>
              <button
                onClick={onSignOut}
                title="Sign out of account"
                className="p-0.5 rounded hover:bg-emerald-200 text-emerald-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Sign in or create account to save personal rooms"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span>Sign In / Up</span>
            </button>
          )}

          {/* Pair Code Quick Pill */}
          {pairCode && (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenPairModal}
                title="Click to view or join another room/group code"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
              >
                <Link2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Room:</span>
                <span className="font-mono font-semibold tracking-wider text-slate-900">
                  {pairCode}
                </span>
                <span
                  onClick={copyCode}
                  className="ml-1 p-0.5 rounded hover:bg-slate-300 transition-colors"
                  title="Copy Room Code"
                >
                  {copiedCode ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                  )}
                </span>
              </button>

              <button
                onClick={onLeaveRoom}
                title="Leave this room and return to gateway"
                className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Cloud Connection Pill (Eloquent Style "On ☁️") */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isConnected
                ? "bg-sky-100/90 text-sky-800 border border-sky-200/90 shadow-2xs"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            <span>{isConnected ? "On" : "Syncing"}</span>
            {isConnected ? (
              <Cloud className="w-3.5 h-3.5 text-sky-600 fill-sky-600/30" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
            )}
          </div>
        </div>
      </div>

      {/* Subtitle / Helper description */}
      <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <p>
          Speak with Whisper Flow on mobile — syncs live with your laptop terminal.
        </p>

        <div className="flex items-center gap-2">
          {/* Laptop Auto-Copy Switch */}
          <button
            onClick={onToggleAutoCopy}
            className={`self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border cursor-pointer ${
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

          {/* Desktop Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title="Settings & 1-Hour Self-Destruct rules"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Settings</span>
          </button>
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
