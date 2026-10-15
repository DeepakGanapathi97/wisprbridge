"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, Trash2, Bookmark, BookmarkCheck, Clock } from "lucide-react";
import { Prompt } from "@/lib/supabase";

interface PromptCardProps {
  prompt: Prompt;
  isCopied: boolean;
  onCopy: (text: string, id: string) => void;
  onToggleKeep: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  onClickCard: (prompt: Prompt) => void;
}

export function PromptCard({
  prompt,
  isCopied,
  onCopy,
  onToggleKeep,
  onDelete,
  onClickCard,
}: PromptCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Calculate live countdown timer for 1-hour self-destruction
  useEffect(() => {
    if (prompt.is_kept) {
      setTimeLeft("Kept");
      return;
    }

    const updateTimer = () => {
      const expiresAtMs = new Date(prompt.expires_at).getTime();
      const diffSecs = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));

      if (diffSecs <= 0) {
        setTimeLeft("Expired");
      } else if (diffSecs < 60) {
        setTimeLeft(`${diffSecs}s left`);
      } else {
        const mins = Math.floor(diffSecs / 60);
        setTimeLeft(`${mins}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 5000);
    return () => clearInterval(interval);
  }, [prompt.expires_at, prompt.is_kept]);

  const formattedTime = new Date(prompt.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3">
      {/* Top Text Content (Clickable to open Reader Modal) */}
      <div
        onClick={() => onClickCard(prompt)}
        className="cursor-pointer"
        title="Click to view full prompt in reader modal"
      >
        <p className="text-slate-900 font-medium text-sm sm:text-base leading-snug line-clamp-3 select-text group-hover:text-blue-900 transition-colors">
          {prompt.text}
        </p>
      </div>

      {/* Bottom Metadata Badges and Action Row */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        {/* Eloquent Style Pill Badges */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Timestamp Pill */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formattedTime}</span>
          </span>

          {/* Expiry / Kept Status Pill */}
          {prompt.is_kept ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <BookmarkCheck className="w-3 h-3 text-emerald-600" />
              <span>Kept</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{timeLeft}</span>
            </span>
          )}

          {/* Copied Count Badge if > 0 */}
          {prompt.copied_count > 0 && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
              Copied {prompt.copied_count}×
            </span>
          )}
        </div>

        {/* Action Buttons: Keep + Copy (next to delete) + Delete */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Keep / Pin Toggle */}
          <button
            onClick={() => onToggleKeep(prompt.id, prompt.is_kept)}
            title={prompt.is_kept ? "Unkeep (restore 1-hour self-destruct)" : "Keep prompt (prevents auto-delete)"}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              prompt.is_kept
                ? "text-emerald-700 hover:bg-emerald-50"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            {prompt.is_kept ? (
              <BookmarkCheck className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          {/* Copy Icon (Requested directly next to delete) */}
          <button
            onClick={() => onCopy(prompt.text, prompt.id)}
            title="Copy prompt to clipboard"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isCopied
                ? "bg-emerald-100 text-emerald-700 scale-105"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Delete Trash Icon */}
          <button
            onClick={() => onDelete(prompt.id)}
            title="Delete prompt"
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
