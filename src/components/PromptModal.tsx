"use client";

import React, { useEffect } from "react";
import { X, Copy, Check, Trash2, Bookmark, BookmarkCheck, Clock, Layers } from "lucide-react";
import { Prompt } from "@/lib/supabase";

interface PromptModalProps {
  prompt: Prompt | null;
  onClose: () => void;
  onCopy: (text: string, id: string) => void;
  onToggleKeep: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  isCopied: boolean;
}

export function PromptModal({
  prompt,
  onClose,
  onCopy,
  onToggleKeep,
  onDelete,
  isCopied,
}: PromptModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!prompt) return null;

  const formattedDate = new Date(prompt.created_at).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const wordCount = prompt.text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = prompt.text.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-5 sm:p-7 shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formattedDate}</span>
            </span>

            {prompt.is_kept ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ⭐ Kept (Saved)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                ⏳ 1-Hour Ephemeral
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            title="Close modal (Esc)"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Full Prompt Content */}
        <div className="my-5 overflow-y-auto pr-1 flex-1">
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 select-text">
            <p className="text-slate-900 font-normal text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words font-sans">
              {prompt.text}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-slate-400 pb-4">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>{wordCount} words</span>
          </span>
          <span>•</span>
          <span>{charCount} characters</span>
          {prompt.copied_count > 0 && (
            <>
              <span>•</span>
              <span>Copied {prompt.copied_count} times</span>
            </>
          )}
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Keep / Pin Toggle Button */}
            <button
              onClick={() => onToggleKeep(prompt.id, prompt.is_kept)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer border ${
                prompt.is_kept
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {prompt.is_kept ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>Kept (Won&apos;t Expire)</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  <span>Keep Prompt</span>
                </>
              )}
            </button>

            {/* Delete Button */}
            <button
              onClick={() => {
                onDelete(prompt.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>

          {/* Large Copy to Clipboard Button */}
          <button
            onClick={() => onCopy(prompt.text, prompt.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer ${
              isCopied
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-950 text-white hover:bg-slate-800"
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Full Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
