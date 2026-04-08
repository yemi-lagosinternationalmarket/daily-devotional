"use client";

import { useState, useEffect } from "react";
import type { Devotional } from "@/lib/types";

interface BibleVerse {
  verse: number;
  text: string;
}

function parseChapterRef(scriptureRef: string): string | null {
  // "Philippians 4:6-7" → "Philippians 4"
  // "1 John 3:16" → "1 John 3"
  // "Psalm 23:1-6" → "Psalm 23"
  const match = scriptureRef.match(/^(.+?)\s+(\d+):\d+/);
  if (match) return `${match[1]} ${match[2]}`;
  return null;
}

interface StepReadProps {
  devotional: Devotional;
  onNext: () => void;
}

export function StepRead({ devotional, onNext }: StepReadProps) {
  const [showFullChapter, setShowFullChapter] = useState(false);
  const [chapterVerses, setChapterVerses] = useState<BibleVerse[] | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string | null>(null);

  // Prefetch chapter on mount
  useEffect(() => {
    const ref = parseChapterRef(devotional.scripture_ref);
    if (!ref) return;

    const encoded = encodeURIComponent(ref);
    fetch(`https://bible-api.com/${encoded}?translation=web`)
      .then((r) => r.json())
      .then((data) => {
        if (data.verses && data.verses.length > 0) {
          setChapterVerses(data.verses.map((v: { verse: number; text: string }) => ({
            verse: v.verse,
            text: v.text.trim(),
          })));
          setChapterTitle(data.reference || ref);
        }
      })
      .catch(() => {});
  }, [devotional.scripture_ref]);

  return (
    <div className="max-w-[640px] mx-auto px-8">
      <p className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase text-center mb-5">
        Read
      </p>

      <div className="text-lg text-[var(--text-secondary)] leading-[1.85] mb-6"
        dangerouslySetInnerHTML={{
          __html: devotional.scripture_text.replace(
            devotional.key_verse,
            `<span class="text-[var(--text-primary)] font-medium">${devotional.key_verse}</span>`
          ),
        }}
      />

      <p className="text-[13px] font-medium text-[var(--text-ghost)] tracking-[0.3px] mb-6">
        {devotional.scripture_ref} {devotional.scripture_translation}
      </p>

      {!showFullChapter && (
        <button
          onClick={() => setShowFullChapter(true)}
          className="text-[13px] text-[var(--text-faint)] hover:text-[var(--text-ghost)] transition-colors cursor-pointer mb-8"
        >
          Read full chapter →
        </button>
      )}

      {showFullChapter && (
        <div className="mt-4 mb-8 p-6 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]">
          {chapterTitle && (
            <p className="text-[12px] font-semibold text-[var(--text-ghost)] tracking-[1px] uppercase mb-4">
              {chapterTitle}
              <span className="ml-2 font-normal normal-case tracking-normal text-[var(--text-faint)]">WEB</span>
            </p>
          )}
          {chapterVerses ? (
            <div className="flex flex-col gap-1">
              {chapterVerses.map((v) => (
                <p key={v.verse} className="text-sm text-[var(--text-tertiary)] leading-[1.8]">
                  <span className="text-[10px] text-[var(--text-faint)] mr-1.5 align-super">{v.verse}</span>
                  {v.text}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] leading-[1.8] whitespace-pre-wrap">
              {devotional.full_chapter_text}
            </p>
          )}
          <button
            onClick={() => setShowFullChapter(false)}
            className="text-[12px] text-[var(--text-faint)] hover:text-[var(--text-ghost)] mt-4 cursor-pointer"
          >
            Collapse
          </button>
        </div>
      )}

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2">
        <button
          onClick={onNext}
          className="py-3.5 px-11 rounded-xl
            bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
            hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
            transition-all duration-150 cursor-pointer
            text-[15px] font-medium text-[var(--text-primary)]"
        >
          I&apos;ve read it ✓
        </button>
      </div>
    </div>
  );
}
