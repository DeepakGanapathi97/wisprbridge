"use client";

import React from "react";
import { X, Settings, Laptop, Clock, Database, Trash2, CheckCircle2 } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoCopyEnabled: boolean;
  onToggleAutoCopy: () => void;
  isSupabaseConfigured: boolean;
  onPurgeExpired: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  autoCopyEnabled,
  onToggleAutoCopy,
  isSupabaseConfigured,
  onPurgeExpired,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full border border-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Settings & Rules</h2>
              <p className="text-xs text-slate-500">Lifecycle & clipboard preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm text-slate-700">
          {/* Auto Copy Preference */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-start gap-3">
              <Laptop className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block text-xs sm:text-sm">
                  Auto-Copy on Arrival
                </span>
                <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                  Copies incoming prompts to clipboard when this browser tab is active.
                </span>
              </div>
            </div>
            <button
              onClick={onToggleAutoCopy}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                autoCopyEnabled ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoCopyEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 1-Hour Self-Destruct Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-amber-900 block text-xs sm:text-sm">
                  1-Hour Rolling Self-Destruct
                </span>
                <span className="text-xs text-amber-800/80 block leading-normal mt-0.5">
                  All prompts automatically expire and self-destruct after 60 minutes unless marked with the <strong>&quot;Keep&quot;</strong> toggle.
                </span>
              </div>
            </div>
          </div>

          {/* Supabase Status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-slate-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block text-xs sm:text-sm">
                  Supabase Cloud DB
                </span>
                <span className="text-xs text-slate-500 block">
                  {isSupabaseConfigured ? "Connected & Live" : "Local Demo Mode"}
                </span>
              </div>
            </div>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                Simulated
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onPurgeExpired();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Expired Prompts Now</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
