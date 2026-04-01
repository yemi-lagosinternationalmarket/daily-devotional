"use client";

import { useState } from "react";
import type { VibeType } from "@/lib/music";

interface VibeBarProps {
  activeVibe: VibeType;
  onVibeChange: (vibe: VibeType) => void;
  onSearch: (query: string) => void;
}

export function VibeBar({ activeVibe, onVibeChange, onSearch }: VibeBarProps) {
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState("");

  const vibes: { key: VibeType; label: string }[] = [
    { key: "praise", label: "Praise" },
    { key: "worship", label: "Worship" },
    { key: "instrumental", label: "Instrumental" },
  ];

  if (searchMode) {
    return (
      <div className="flex bg-[rgba(255,255,255,0.03)] rounded-[10px] p-[3px] items-center">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) onSearch(query.trim());
          }}
          placeholder="Search for a song or artist..."
          className="flex-1 h-[34px] px-3 bg-transparent border-none
            text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]
            outline-none"
        />
        <button
          onClick={() => {
            setSearchMode(false);
            setQuery("");
          }}
          className="w-[34px] h-[34px] flex items-center justify-center
            text-sm text-[var(--text-ghost)] rounded-lg
            hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]
            transition-all duration-150 cursor-pointer"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex bg-[rgba(255,255,255,0.03)] rounded-[10px] p-[3px] gap-[2px]">
      {vibes.map((v) => (
        <button
          key={v.key}
          onClick={() => onVibeChange(v.key)}
          className={`flex-1 py-2.5 text-center text-[13px] font-medium rounded-lg transition-all duration-200 cursor-pointer
            ${activeVibe === v.key
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text-primary)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
        >
          {v.label}
        </button>
      ))}
      <button
        onClick={() => setSearchMode(true)}
        className="flex-none w-10 py-2.5 text-center text-sm text-[var(--text-ghost)]
          rounded-lg cursor-pointer hover:text-[var(--text-secondary)]
          transition-all duration-200 border-l border-[rgba(255,255,255,0.04)] ml-[2px]"
      >
        🔍
      </button>
    </div>
  );
}
