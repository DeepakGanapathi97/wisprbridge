"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";

interface InputBarProps {
  onAddPrompt: (text: string) => void;
}

export function InputBar({ onAddPrompt }: InputBarProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddPrompt(text);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 mb-6">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white rounded-2xl sm:rounded-3xl p-1.5 pl-4 sm:pl-5 border border-slate-200/90 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "Create unit tests for the checkout flow..."'
          className="flex-1 bg-transparent text-sm sm:text-base text-slate-800 placeholder-slate-400 outline-none w-full"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Circular Solid '+' Action Button (Eloquent Style) */}
        <button
          type="submit"
          disabled={!text.trim()}
          title="Add and sync prompt to laptop"
          className="w-10 h-10 rounded-full bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
}
