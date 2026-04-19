"use client";

import { LyricsPayload, LyricsWord } from "@one-app/types";
import { useMemo } from "react";

const splitIntoLines = (words: LyricsWord[]): LyricsWord[][] => {
  const lines: LyricsWord[][] = [];
  let current: LyricsWord[] = [];
  const maxPerLine = 7;
  const gap = 2.6;
  for (const word of words) {
    if (!current.length) {
      current.push(word);
      continue;
    }
    const prev = current[current.length - 1];
    const shouldBreak = word.start - (prev.end ?? prev.start) > gap || current.length >= maxPerLine;
    if (shouldBreak) {
      lines.push(current);
      current = [word];
      continue;
    }
    current.push(word);
  }
  if (current.length) lines.push(current);
  return lines;
};

export function LyricsViewer({
  payload,
  currentTime = 0,
  loading
}: {
  payload?: LyricsPayload;
  currentTime?: number;
  loading?: boolean;
}) {
  const lines = useMemo(() => splitIntoLines(payload?.words || []), [payload?.words]);

  if (loading) {
    return <div className="text-sm text-[var(--muted)]">Готовим текст…</div>;
  }
  if (!payload || !payload.words?.length) {
    return <div className="text-sm text-[var(--muted)]">Текст пока не сгенерирован.</div>;
  }

  return (
    <div className="border border-[var(--border)] bg-[color-mix(in_srgb,var(--glass)_90%,transparent)] rounded-2xl p-4 space-y-2 max-h-80 overflow-auto">
      {lines.map((line, idx) => (
        <div key={idx} className="flex flex-wrap gap-1 leading-relaxed">
          {line.map((word, wIdx) => {
            const active = currentTime >= word.start && currentTime < (word.end ?? word.start + 0.12);
            return (
              <span
                key={`${idx}-${wIdx}-${word.word}-${word.start.toFixed(2)}`}
                className={`px-[6px] py-[2px] rounded-full text-sm transition-colors ${
                  active ? "bg-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-[var(--accent-strong)]" : "text-[var(--fg)]/78"
                }`}
              >
                {word.word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
