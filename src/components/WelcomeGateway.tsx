"use client";

import React, { useState } from "react";
import { Sparkles, Laptop, UserCheck, ArrowRight, ShieldCheck, Users } from "lucide-react";

interface WelcomeGatewayProps {
  onJoinRoom: (code: string) => Promise<boolean>;
  onOpenAuthModal: () => void;
  onStartGuestRoom: () => void;
}

export function WelcomeGateway({
  onJoinRoom,
  onOpenAuthModal,
  onStartGuestRoom,
}: WelcomeGatewayProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().replace(/\D/g, "");
    if (clean.length !== 6) return;
    setLoading(true);
    await onJoinRoom(clean);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto w-full px-4 sm:px-6 my-auto py-10 flex flex-col items-center">
      {/* Brand Hero */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md mb-4">
        <Sparkles className="w-7 h-7" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-center">
        Welcome to WisprBridge
      </h1>
      <p className="text-sm text-slate-500 text-center max-w-sm mt-1.5 leading-relaxed">
        Speak on Android with Whisper Flow. Sync live to your corporate terminal in sub-seconds.
      </p>

      {/* Main Choice Cards */}
      <div className="w-full mt-8 space-y-4">
        {/* OPTION 1: Join Room or Group (Perfect for Laptop) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Join a Room or Group
              </h2>
              <p className="text-xs text-slate-500">
                On your laptop? Enter the 6-digit room code from your phone
              </p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="mt-4 flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 582194"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-center font-mono text-base tracking-widest font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={code.length !== 6 || loading}
              className="px-5 py-2.5 rounded-2xl bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-40 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <span>Join Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Zero personal passwords or login required on work laptops.</span>
          </div>
        </div>

        {/* OPTION 2: Sign In / Create Account (For Mobile Host or Personal Sync) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  Sign In / Create Account
                </h2>
                <p className="text-xs text-slate-500">
                  On mobile? Create or access your private rooms & prompts
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
            >
              Sign In / Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Guest / Direct Demo fallback */}
      <button
        onClick={onStartGuestRoom}
        className="mt-6 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <Users className="w-3.5 h-3.5" />
        <span>Or start a quick temporary guest room without signing in</span>
      </button>
    </div>
  );
}
