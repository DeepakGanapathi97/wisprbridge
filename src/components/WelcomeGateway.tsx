"use client";

import React, { useState } from "react";
import { Sparkles, Laptop, PlusCircle, ArrowRight, ShieldCheck, LogIn, LogOut } from "lucide-react";

interface WelcomeGatewayProps {
  onJoinRoom: (code: string) => Promise<boolean>;
  onOpenAuthModal: () => void;
  onStartGuestRoom: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
}

export function WelcomeGateway({
  onJoinRoom,
  onOpenAuthModal,
  onStartGuestRoom,
  userEmail,
  onSignOut,
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
    <div className="max-w-xl mx-auto w-full px-4 sm:px-6 my-auto py-8 sm:py-12 flex flex-col items-center">
      {/* Top Bar with Optional Sign In or Authenticated Status */}
      <div className="w-full flex items-center justify-end mb-4">
        {userEmail ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span>Signed in as <strong className="font-semibold">{userEmail}</strong></span>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="ml-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-950 underline cursor-pointer"
                title="Sign out of your account"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-blue-600" />
            <span>Sign In / Sign Up (Optional)</span>
          </button>
        )}
      </div>

      {/* Brand Hero */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md mb-3">
        <Sparkles className="w-7 h-7" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-center">
        WisprBridge
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 text-center max-w-sm mt-1 leading-relaxed">
        WisprFlow / Eloquent on one device — syncs live with the others. No login required—just pair two devices.
      </p>

      {/* Two Primary Action Cards */}
      <div className="w-full mt-7 space-y-4">
        {/* ACTION 1: Join Existing Room (Laptop Receiver) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Join a Room / Device
              </h2>
              <p className="text-xs text-slate-500">
                Enter the 6-digit code shown on your phone to connect this web browser
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
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-center font-mono text-base sm:text-lg tracking-widest font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
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
            <span>Isolated private room. Prompts are never shared with other users.</span>
          </div>
        </div>

        {/* ACTION 2: Create Instant Private Room (Mobile or Web Host) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  Create a New Room
                </h2>
                <p className="text-xs text-slate-500">
                  {userEmail
                    ? `Start a private room linked to your account (${userEmail})`
                    : "Start a private room and get a 6-digit code to pair with your laptop"}
                </p>
              </div>
            </div>

            <button
              onClick={onStartGuestRoom}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>Create Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
