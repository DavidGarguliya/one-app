import { LyricsPayload, LyricsWord } from "@one-app/types";

const clampTime = (seconds: number) => Math.max(0, Number.isFinite(seconds) ? seconds : 0);

const formatTimestamp = (seconds: number, wrap = true) => {
  const safe = clampTime(seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const cs = Math.floor((safe % 1) * 100);
  const body = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  return wrap ? `[${body}]` : body;
};

const splitIntoLines = (words: LyricsWord[], maxPerLine = 8, gapSeconds = 2.5): LyricsWord[][] => {
  const lines: LyricsWord[][] = [];
  let current: LyricsWord[] = [];
  for (const word of words) {
    if (!current.length) {
      current.push(word);
      continue;
    }
    const prev = current[current.length - 1];
    const gap = clampTime(word.start) - clampTime(prev.end ?? prev.start);
    const shouldBreak = gap > gapSeconds || current.length >= maxPerLine;
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

export const toEnhancedLrc = (payload: LyricsPayload): string => {
  const lines = splitIntoLines(payload.words || []);
  if (!lines.length) return "";
  return lines
    .map((line) => {
      const base = formatTimestamp(line[0]?.start ?? 0, true);
      const withTags = line.map((item) => `<${formatTimestamp(item.start ?? 0, false)}>${item.word}`);
      return `${base} ${withTags.join(" ")}`;
    })
    .join("\n");
};

export const lyricsPlainText = (payload: LyricsPayload): string => {
  const lines = splitIntoLines(payload.words || []);
  if (!lines.length) return "";
  return lines.map((line) => line.map((w) => w.word).join(" ")).join("\n");
};
