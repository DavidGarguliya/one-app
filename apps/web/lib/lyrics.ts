import { LyricsJob, LyricsResult } from "@one-app/types";
import { apiBase } from "./api";

const base = apiBase.replace(/\/$/, "");

const safeJson = async <T>(res: Response): Promise<T | null> => {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

export const lyricsUiEnabled = (process.env.NEXT_PUBLIC_LYRICS_ENABLED || "1") !== "0";

export async function requestLyricsGeneration(
  trackId: string,
  payload: Partial<{ language: string; provider: string; separateVocals: boolean; force: boolean }>
): Promise<LyricsJob | null> {
  const res = await fetch(`${base}/v1/lyrics/generate/${trackId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload || {}),
    cache: "no-store"
  });
  if (!res.ok) return null;
  return (await safeJson<LyricsJob>(res)) || null;
}

export async function fetchLyricsStatus(trackId: string): Promise<LyricsJob | null> {
  const res = await fetch(`${base}/v1/lyrics/status/${trackId}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await safeJson<LyricsJob>(res)) || null;
}

export async function fetchLyricsResult(trackId: string): Promise<LyricsResult | null> {
  const res = await fetch(`${base}/v1/lyrics/result/${trackId}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await safeJson<LyricsResult>(res)) || null;
}

export const lyricsDownloadUrl = (trackId: string) => `${base}/v1/lyrics/download/${trackId}/lrc`;
