"use client";

import React, { useState } from "react";
import { Sparkles, Laptop, PlusCircle, ArrowRight, ShieldCheck, LogIn, LogOut, Layers, Radio, Copy, Check, Trash2 } from "lucide-react";
import { Session } from "@/lib/supabase";

interface WelcomeGatewayProps {
  onJoinRoom: (code: string) => Promise<boolean>;
  onOpenAuthModal: () => void;
  onStartGuestRoom: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  userRooms?: Session[];
  loadingUserRooms?: boolean;
  onEnterRoom?: (room: Session) => void;
  onDeleteRoom?: (sessionId: string) => void;
  onCreateNamedRoom?: (label?: string) => Promise<unknown>;
  onCopyCode?: (code: string) => void;
}

export function WelcomeGateway({
  onJoinRoom,
  onOpenAuthModal,
  onStartGuestRoom,
  userEmail,
  onSignOut,
  userRooms = [],
  loadingUserRooms = false,
  onEnterRoom,
  onDeleteRoom,
  onCreateNamedRoom,
  onCopyCode,
}: WelcomeGatewayProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCreatingNamedRoom, setIsCreatingNamedRoom] = useState(false);
  const [namedRoomLabel, setNamedRoomLabel] = useState("");
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().replace(/\D/g, "");
    if (clean.length !== 6) return;
    setLoading(true);
    await onJoinRoom(clean);
    setLoading(false);
  };

  const handleCreateCustomRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateNamedRoom) {
      onStartGuestRoom();
      return;
    }
    setCreatingLoading(true);
    await onCreateNamedRoom(namedRoomLabel);
    setCreatingLoading(false);
    setIsCreatingNamedRoom(false);
    setNamedRoomLabel("");
  };

  const handleCopyCode = (roomCode: string) => {
    if (onCopyCode) {
      onCopyCode(roomCode);
    } else {
      navigator.clipboard.writeText(roomCode);
    }
    setCopiedCodeId(roomCode);
    setTimeout(() => {
      setCopiedCodeId((prev) => (prev === roomCode ? null : prev));
    }, 2000);
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

      {/* Brand Title */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-center">
        WisprBridge
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 text-center max-w-sm mt-1 leading-relaxed">
        WisprFlow / Eloquent on one device — syncs live with the others. No login required—just pair two devices.
      </p>

      {/* ACTIVE ROOMS DASHBOARD (Visible to Authenticated Users) */}
      {userEmail && (
        <div className="w-full mt-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Your Active Rooms
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {userRooms.length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Manage multiple rooms &amp; PCs from this orchestrator account
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreatingNamedRoom((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isCreatingNamedRoom ? "Close Form" : "New Room"}</span>
            </button>
          </div>

          {/* New Room Quick Form */}
          {isCreatingNamedRoom && (
            <form onSubmit={handleCreateCustomRoom} className="mb-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-2 animate-in fade-in duration-150">
              <input
                type="text"
                value={namedRoomLabel}
                onChange={(e) => setNamedRoomLabel(e.target.value)}
                placeholder="Room Label (e.g. Workstation PC, Terminal 2, Living Room...)"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 transition-all"
                autoFocus
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={creatingLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {creatingLoading ? "Creating..." : "Create & Enter"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNamedRoom(false)}
                  className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Room List or Empty State */}
          {loadingUserRooms ? (
            <div className="py-6 flex justify-center items-center gap-2 text-slate-400 text-xs">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading your active rooms...</span>
            </div>
          ) : userRooms.length > 0 ? (
            <div className="space-y-2.5">
              {userRooms.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex-wrap sm:flex-nowrap"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-xl bg-white border border-slate-200 font-mono font-bold text-sm tracking-wider text-slate-900 shadow-2xs">
                      #{r.pair_code}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{r.device_label || `Room #${r.pair_code}`}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Created {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleCopyCode(r.pair_code)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 shadow-2xs cursor-pointer flex items-center gap-1"
                      title="Copy 6-digit room code for other PCs"
                    >
                      {copiedCodeId === r.pair_code ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedCodeId === r.pair_code ? "Copied" : "Copy Code"}</span>
                    </button>
                    {onEnterRoom && (
                      <button
                        onClick={() => onEnterRoom(r)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>Enter Room</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {onDeleteRoom && (
                      <button
                        onClick={() => onDeleteRoom(r.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Close room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Radio className="w-6 h-6 text-slate-400 mx-auto mb-1.5 opacity-60" />
              <p className="text-xs font-medium text-slate-600">No active rooms under this account</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;New Room&quot; above to create a room for your PCs</p>
            </div>
          )}
        </div>
      )}

      {/* Two Primary Action Cards */}
      <div className="w-full mt-4 space-y-4">
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
                Enter the 6-digit code shown on your phone or orchestrator to connect this web browser
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
                    ? `Start an instant room linked to your account (${userEmail})`
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
