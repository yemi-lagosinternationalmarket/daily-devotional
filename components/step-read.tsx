"use client";

import { useState, useEffect } from "react";
import type { Devotional } from "@/lib/types";

interface BibleVerse {
  verse: number;
  text: string;
}

// Map book names to helloao.org book IDs
const BOOK_IDS: Record<string, string> = {
  "genesis": "GEN", "exodus": "EXO", "leviticus": "LEV", "numbers": "NUM",
  "deuteronomy": "DEU", "joshua": "JOS", "judges": "JDG", "ruth": "RUT",
  "1 samuel": "1SA", "2 samuel": "2SA", "1 kings": "1KI", "2 kings": "2KI",
  "1 chronicles": "1CH", "2 chronicles": "2CH", "ezra": "EZR", "nehemiah": "NEH",
  "esther": "EST", "job": "JOB", "psalm": "PSA", "psalms": "PSA",
  "proverbs": "PRO", "ecclesiastes": "ECC", "song of solomon": "SNG",
  "isaiah": "ISA", "jeremiah": "JER", "lamentations": "LAM", "ezekiel": "EZK",
  "daniel": "DAN", "hosea": "HOS", "joel": "JOL", "amos": "AMO",
  "obadiah": "OBA", "jonah": "JON", "micah": "MIC", "nahum": "NAM",
  "habakkuk": "HAB", "zephaniah": "ZEP", "haggai": "HAG", "zechariah": "ZEC",
  "malachi": "MAL", "matthew": "MAT", "mark": "MRK", "luke": "LUK",
  "john": "JHN", "acts": "ACT", "romans": "ROM", "1 corinthians": "1CO",
  "2 corinthians": "2CO", "galatians": "GAL", "ephesians": "EPH",
  "philippians": "PHP", "colossians": "COL", "1 thessalonians": "1TH",
  "2 thessalonians": "2TH", "1 timothy": "1TI", "2 timothy": "2TI",
  "titus": "TIT", "philemon": "PHM", "hebrews": "HEB", "james": "JAS",
  "1 peter": "1PE", "2 peter": "2PE", "1 john": "1JN", "2 john": "2JN",
  "3 john": "3JN", "jude": "JUD", "revelation": "REV",
};

function parseChapterRef(scriptureRef: string): { book: string; chapter: number } | null {
  const match = scriptureRef.match(/^(.+?)\s+(\d+):\d+/);
  if (!match) return null;
  const bookName = match[1].toLowerCase().trim();
  const bookId = BOOK_IDS[bookName];
  if (!bookId) return null;
  return { book: bookId, chapter: parseInt(match[2]) };
}

function extractVerseText(content: unknown[]): string {
  return content
    .map((c) => {
      if (typeof c === "string") return c;
      if (typeof c === "object" && c !== null && "text" in c) return (c as { text: string }).text;
      return "";
    })
    .join("")
    .trim();
}

interface StepReadProps {
  devotional: Devotional;
  onNext: () => void;
}

export function StepRead({ devotional, onNext }: StepReadProps) {
  const [showFullChapter, setShowFullChapter] = useState(false);
  const [chapterVerses, setChapterVerses] = useState<BibleVerse[] | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string | null>(null);
  const [translationLabel, setTranslationLabel] = useState<string>("");

  // Prefetch chapter on mount
  useEffect(() => {
    const parsed = parseChapterRef(devotional.scripture_ref);
    if (!parsed) return;

    const translationId = devotional.scripture_translation === "KJV" ? "eng_kjv" : "BSB";
    const label = translationId === "eng_kjv" ? "KJV" : "BSB";

    fetch(`https://bible.helloao.org/api/${translationId}/${parsed.book}/${parsed.chapter}.json`)
      .then((r) => r.json())
      .then((data) => {
        const content = data?.chapter?.content;
        if (!content) return;

        const verses: BibleVerse[] = [];
        let heading = "";

        for (const item of content) {
          if (item.type === "heading" && !heading) {
            heading = item.content?.join("") || "";
          }
          if (item.type === "verse") {
            verses.push({
              verse: item.number,
              text: extractVerseText(item.content),
            });
          }
        }

        if (verses.length > 0) {
          const bookMatch = devotional.scripture_ref.match(/^(.+?)\s+(\d+):/);
          const title = bookMatch ? `${bookMatch[1]} ${bookMatch[2]}` : heading;
          setChapterVerses(verses);
          setChapterTitle(title);
          setTranslationLabel(label);
        }
      })
      .catch(() => {});
  }, [devotional.scripture_ref, devotional.scripture_translation]);

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
              {translationLabel && (
                <span className="ml-2 font-normal normal-case tracking-normal text-[var(--text-faint)]">{translationLabel}</span>
              )}
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

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2">
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
