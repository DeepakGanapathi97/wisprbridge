"use client";

import React, { useState } from "react";
import { X, Users, ArrowRight, RefreshCw, Copy, Check, ShieldCheck, Laptop } from "lucide-react";

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  onPairWithCode: (code: string) => Promise<boolean>;
  onGenerateNewCode: () => Promise<void>;
}

export function PairingModal({
  isOpen,
  onClose,
  currentCode,
  onPairWithCode,
  onGenerateNewCode,
}: PairingModalProps) {
  const [inputCode, setInputCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim().length !== 6) return;
    setIsSubmitting(true);
    const success = await onPairWithCode(inputCode);
    setIsSubmitting(false);
    if (success) {
      setInputCode("");
      onClose();
    }
  };

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
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Room & Group Pairing</h2>
              <p className="text-xs text-slate-500">Connect mobile, laptop, or team group</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Current Active Code */}
        <div className="my-5 p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/30 border border-slate-200/80 text-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Active Room Code
          </span>
          <div className="my-2 flex items-center justify-center gap-2">
            <span className="font-mono text-3xl font-bold tracking-widest text-slate-900">
              {currentCode ? `${currentCode.slice(0, 3)} - ${currentCode.slice(3)}` : "------"}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
              title="Copy 6-digit code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Share this code with your other device or team to sync prompts live.
          </p>

          <button
            onClick={onGenerateNewCode}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Generate New Room Code</span>
          </button>
        </div>

        {/* Section 2: Join another Room or Group */}
        <form onSubmit={handleJoin} className="mt-4 pt-4 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Join Another Room or Group
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-center font-mono text-base tracking-widest font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={inputCode.length !== 6 || isSubmitting}
              className="px-4 py-2.5 rounded-2xl bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <span>Join Group</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Security badge */}
        <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 border border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Zero passwords or login required when joining rooms via code.</span>
        </div>
      </div>
    </div>
  );
}
