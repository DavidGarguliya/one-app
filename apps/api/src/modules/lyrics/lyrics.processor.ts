import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { LyricsPayload, LyricsProvider, LyricsWord } from "@one-app/types";
import { TracksService } from "../tracks/tracks.service";
import { StorageService } from "../../storage/storage.service";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { join } from "path";
import { promises as fs } from "fs";
import { existsSync } from "fs";
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { toEnhancedLrc } from "./utils/lrc.utils";

export type LyricsQueuePayload = {
  jobId: string;
  trackId: string;
  provider: LyricsProvider;
  language: string;
  separateVocals?: boolean;
};

export type LyricsQueueResult = {
  payload: LyricsPayload;
  lrc: string;
  jsonUrl: string;
  lrcUrl: string;
};

const sanitizeWord = (input: string) => input.replace(/[^\p{L}\p{N}'-]+/gu, "").trim();

@Injectable()
export class LyricsProcessor {
  constructor(private readonly tracksService: TracksService, private readonly storageService: StorageService) {}

  private resolveFfmpegBinary() {
    const envPath = process.env.FFMPEG_PATH;
    if (envPath && existsSync(envPath)) return envPath;
    if (ffmpegPath && existsSync(ffmpegPath as string)) return ffmpegPath as string;
    // best-effort: rely on system ffmpeg if present in PATH; spawn will fail if absent.
    return existsSync("/usr/bin/ffmpeg") ? "/usr/bin/ffmpeg" : null;
  }

  async handle(job: LyricsQueuePayload): Promise<LyricsQueueResult> {
    const track = this.tracksService.findOne(job.trackId);
    if (!track?.audioUrl) {
      throw new InternalServerErrorException("Audio source is missing");
    }
    const audioBuffer = await this.fetchAudio(track.audioUrl);
    const { processedPath, cleanup } = await this.preprocessAudio(audioBuffer, job.separateVocals);
    try {
      const payload = await this.transcribe(
        processedPath,
        track.duration || 0,
        job.language || "auto",
        track.title,
        track.artist,
        job.trackId,
        job.provider,
        (track as any)?.story,
        (track as any)?.clientRequest
      );
      if (!payload.words.length) {
        throw new InternalServerErrorException("no vocals detected");
      }
      const normalized = this.normalize(payload);
      const lrc = toEnhancedLrc(normalized);
      const jsonUrl = await this.storageService.uploadBuffer(Buffer.from(JSON.stringify(normalized), "utf8"), "application/json");
      const lrcUrl = await this.storageService.uploadBuffer(Buffer.from(lrc, "utf8"), "text/plain");
      return { payload: normalized, lrc, jsonUrl, lrcUrl };
    } finally {
      await cleanup();
    }
  }

  private async fetchAudio(source: string): Promise<Buffer> {
    if (source.startsWith("data:")) {
      const match = /^data:([^;]+);base64,(.+)$/i.exec(source);
      if (!match) throw new InternalServerErrorException("Invalid data URL");
      return Buffer.from(match[2], "base64");
    }
    const res = await fetch(source);
    if (!res.ok) {
      throw new InternalServerErrorException("Failed to fetch audio source");
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  }

  private async preprocessAudio(buffer: Buffer, separateVocals?: boolean) {
    const binary = this.resolveFfmpegBinary();
    const base = join(tmpdir(), `lyrics-${randomUUID()}`);
    const input = `${base}.orig`;
    const output = `${base}.wav`;
    await fs.writeFile(input, buffer);
    if (!binary) {
      // FFmpeg недоступен — вернём исходный файл как есть.
      const cleanup = async () => {
        try {
          await fs.unlink(input);
        } catch {
          /* ignore */
        }
      };
      return { processedPath: input, cleanup };
    }
    const filters = ["loudnorm=I=-16:TP=-1.5:LRA=11"];
    if (separateVocals) {
      // Lightweight vocal emphasis without heavy models; keeps CPU-friendly defaults.
      filters.push("highpass=f=110,lowpass=f=8000");
    }
    const args = ["-y", "-i", input, "-ac", "1", "-ar", "16000", "-af", filters.join(","), output];
    await this.runFfmpeg(args, binary);
    const cleanup = async () => {
      await Promise.all(
        [input, output].map(async (p) => {
          try {
            await fs.unlink(p);
          } catch {
            // ignore
          }
        })
      );
    };
    return { processedPath: output, cleanup };
  }

  private async runFfmpeg(args: string[], binary: string) {
    await new Promise<void>((resolve, reject) => {
      const ff = spawn(binary, args);
      ff.on("error", reject);
      ff.on("close", (code) => {
        if (code === 0) return resolve();
        reject(new InternalServerErrorException("FFmpeg preprocessing failed"));
      });
    });
  }

  private async transcribe(
    processedPath: string,
    declaredDuration: number,
    language: string,
    title?: string,
    artist?: string,
    trackId?: string,
    provider: LyricsProvider = "whisper",
    story?: string,
    clientRequest?: string
  ): Promise<LyricsPayload> {
    if (provider === "deepgram") {
      return await this.transcribeWithDeepgram(processedPath, language, declaredDuration);
    }
    // Stubbed STT provider: spreads meaningful tokens across the track duration.
    const duration = declaredDuration && Number.isFinite(declaredDuration) && declaredDuration > 5 ? declaredDuration : 180;
    const tokens =
      this.seedWordsFromMeta(trackId || processedPath, title, artist, story, clientRequest) || ["Вступление", "куплет", "припев", "финал"];
    const words: LyricsWord[] = [];
    const step = duration / Math.max(tokens.length + 2, 4);
    tokens.forEach((raw, idx) => {
      const word = sanitizeWord(raw);
      if (!word) return;
      const start = Math.max(0, Number((idx + 1) * step - step * 0.8));
      const end = Math.min(duration, start + step * 0.65);
      words.push({ word, start, end });
    });
    return { language: language || "auto", duration, words };
  }

  private seedWordsFromMeta(seed: string, title?: string, artist?: string, story?: string, clientRequest?: string): string[] {
    const collect = (text?: string) =>
      (text || "")
        .replace(/[.,!?()[\]":;]+/g, " ")
        .split(/\s+/)
        .map((t) => sanitizeWord(t))
        .filter((w) => w.length > 1);
    const storyTokens = collect(story);
    const requestTokens = collect(clientRequest);
    const baseTokens = Array.from(
      new Set([...collect(title), ...collect(artist), ...storyTokens.slice(0, 40), ...requestTokens.slice(0, 40)])
    );
    if (baseTokens.length >= 6) return baseTokens;
    // Placeholder: derive a stable but varied seed from path hash to keep determinism per track.
    const hash = Array.from(seed.slice(-12)).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const bank = [
      "ты", "уходила", "ночь", "огни", "сердце", "город", "ветер", "голос", "вспоминаю", "рядом", "шаги",
      "тишина", "дождь", "темнота", "свет", "расскажи", "оставайся", "где-то", "буду", "ждать", "навсегда"
    ];
    const tokens: string[] = [...baseTokens];
    for (let i = tokens.length; i < 18; i += 1) {
      tokens.push(bank[(hash + i * 13) % bank.length]);
    }
    return tokens;
  }

  private async transcribeWithDeepgram(processedPath: string, language: string, declaredDuration: number): Promise<LyricsPayload> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException("DEEPGRAM_API_KEY is not set");
    }
    const buffer = await fs.readFile(processedPath);
    const query = new URLSearchParams();
    if (language && language !== "auto") query.set("language", language);
    query.set("model", process.env.DEEPGRAM_MODEL || "nova-2");
    query.set("smart_format", "false");
    query.set("diarize", "false");
    const endpoint = process.env.DEEPGRAM_ENDPOINT || "https://api.deepgram.com/v1/listen";
    const url = `${endpoint}?${query.toString()}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "audio/wav"
        },
        body: buffer
      });
    if (!res.ok) {
      throw new InternalServerErrorException(`Deepgram failed: ${res.status}`);
    }
    const json: any = await res.json();
    const words = ((json?.results?.channels?.[0]?.alternatives?.[0]?.words as any[]) || [])
      .map((w) => ({
        word: String(w?.word || "").trim(),
        start: Number(w?.start ?? 0),
        end: Number(w?.end ?? w?.start ?? 0)
      }))
      .filter((w) => w.word);
    const langDetected = json?.results?.channels?.[0]?.alternatives?.[0]?.language;
    const duration = declaredDuration || Number(json?.metadata?.duration) || 0;
    return { language: langDetected || language || "auto", duration, words };
  }

  private normalize(payload: LyricsPayload): LyricsPayload {
    const normalizedWords = (payload.words || []).flatMap((item) => {
      const parts = sanitizeWord(item.word)
        .split(/\s+/)
        .map((piece) => piece.trim())
        .filter(Boolean);
      if (!parts.length) return [];
      return parts.map((part, idx) => {
        const span = Math.max(0.12, (item.end ?? item.start) - item.start);
        const shift = idx === 0 ? 0 : idx * (span / parts.length);
        const start = Math.max(0, item.start + shift);
        const end = start + span / parts.length;
        return { word: part, start, end };
      });
    });
    return {
      language: payload.language || "auto",
      duration: payload.duration,
      words: normalizedWords.sort((a, b) => a.start - b.start)
    };
  }
}
