"use client";

import React from "react";

interface TabBarProps {
  activeTab: "all" | "kept";
  onChangeTab: (tab: "all" | "kept") => void;
  totalCount: number;
  keptCount: number;
}

export function TabBar({
  activeTab,
  onChangeTab,
  totalCount,
  keptCount,
}: TabBarProps) {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 border-b border-slate-200/80 mb-4">
      <div className="flex items-center gap-8">
        {/* Tab 1: All Prompts */}
        <button
          onClick={() => onChangeTab("all")}
          className={`relative pb-3 text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "all" ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>All prompts</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === "all"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {totalCount}
          </span>
          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* Tab 2: Kept / Pinned Prompts */}
        <button
          onClick={() => onChangeTab("kept")}
          className={`relative pb-3 text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "kept" ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Kept</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === "kept"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {keptCount}
          </span>
          {activeTab === "kept" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
}
