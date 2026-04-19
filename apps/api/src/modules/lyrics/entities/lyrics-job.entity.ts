import { LyricsJob, LyricsJobStatus, LyricsPayload, LyricsProvider } from "@one-app/types";
import { randomUUID } from "crypto";

export type LyricsJobRecord = LyricsJob & { payload?: LyricsPayload };

export const LYRICS_QUEUE = "lyrics-engine";

export const buildJobRecord = (trackId: string, provider: LyricsProvider, language: string): LyricsJobRecord => {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    trackId,
    provider,
    language,
    status: "queued",
    resultJsonUrl: null,
    lrcUrl: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now
  };
};

export const setJobStatus = (job: LyricsJobRecord, status: LyricsJobStatus, errorMessage?: string) => {
  job.status = status;
  job.updatedAt = new Date().toISOString();
  job.errorMessage = errorMessage ?? null;
};
