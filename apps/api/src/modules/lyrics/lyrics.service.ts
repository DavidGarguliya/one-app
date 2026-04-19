import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LyricsPayload, LyricsResult, LyricsProvider } from "@one-app/types";
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { GenerateLyricsDto } from "./dto/generate-lyrics.dto";
import { buildJobRecord, LYRICS_QUEUE, LyricsJobRecord, setJobStatus } from "./entities/lyrics-job.entity";
import { LyricsProcessor, LyricsQueuePayload } from "./lyrics.processor";
import { TracksService } from "../tracks/tracks.service";

@Injectable()
export class LyricsService implements OnModuleInit, OnModuleDestroy {
  private queue: Queue<LyricsQueuePayload> | null = null;
  private worker: Worker<LyricsQueuePayload> | null = null;
  private connection: Redis | null = null;
  private jobsByTrack = new Map<string, LyricsJobRecord>();
  private payloadCache = new Map<string, LyricsPayload>();
  private lrcCache = new Map<string, string>();
  private enabled: boolean;
  private localMode = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly processor: LyricsProcessor,
    private readonly tracksService: TracksService
  ) {
    const flag = (configService.get<string>("LYRICS_ENGINE_ENABLED") || "").toLowerCase();
    const disabled = ["0", "false", "no", "off"].includes(flag);
    this.enabled = !disabled;
  }

  async onModuleInit() {
    if (!this.enabled) return;
    try {
      const redisUrl = this.configService.get<string>("REDIS_URL") || "redis://127.0.0.1:6379";
      this.connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
      this.queue = new Queue<LyricsQueuePayload>(LYRICS_QUEUE, {
        connection: this.connection,
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true }
      });
      this.worker = new Worker<LyricsQueuePayload>(
        LYRICS_QUEUE,
        async (job) => this.consume(job.data),
        { connection: this.connection, concurrency: 1 }
      );
      this.worker.on("failed", (job, err) => {
        const trackId = job?.data?.trackId;
        if (trackId) this.markFailed(trackId, err?.message || "Lyrics generation failed");
      });
    } catch (e) {
      // Fallback to in-process execution when Redis is unavailable.
      this.localMode = true;
      // eslint-disable-next-line no-console
      console.warn("[lyrics] Queue unavailable, switching to in-process mode", e);
    }
  }

  async onModuleDestroy() {
    if (this.worker) await this.worker.close();
    if (this.queue) await this.queue.close();
    if (this.connection) await this.connection.quit();
  }

  isEnabled() {
    return this.enabled;
  }

  private defaultProvider(): LyricsProvider {
    const env = (this.configService.get<string>("LYRICS_PROVIDER") || "").toLowerCase();
    if (env === "deepgram") return "deepgram";
    if (env === "assemblyai") return "assemblyai";
    if (process.env.DEEPGRAM_API_KEY) return "deepgram";
    return "whisper";
  }

  async requestGeneration(trackId: string, dto: GenerateLyricsDto): Promise<LyricsJobRecord> {
    if (!this.enabled) throw new BadRequestException("Lyrics engine is disabled");
    this.tracksService.findOne(trackId); // ensure track exists
    const existing = this.jobsByTrack.get(trackId) || this.restoreFromTrack(trackId);
    if (existing && existing.status !== "error" && !dto.force) {
      return existing;
    }
    const provider = dto.provider || this.defaultProvider();
    if (provider === "deepgram" && !process.env.DEEPGRAM_API_KEY) {
      throw new BadRequestException("DEEPGRAM_API_KEY is not set");
    }
    const language = dto.language || "auto";
    const record = buildJobRecord(trackId, provider, language);
    this.jobsByTrack.set(trackId, record);
    if (!this.queue || this.localMode) {
      // In-process fallback to keep feature usable without Redis.
      this.processDirect(record, {
        jobId: record.id,
        trackId,
        provider,
        language,
        separateVocals: dto.separateVocals ?? false
      });
      return record;
    }
    await this.queue.add("generate", {
      jobId: record.id,
      trackId,
      provider,
      language,
      separateVocals: dto.separateVocals ?? false
    });
    return record;
  }

  getStatus(trackId: string): LyricsJobRecord {
    const job = this.jobsByTrack.get(trackId) || this.restoreFromTrack(trackId);
    if (!job) throw new NotFoundException("Lyrics job not found");
    return job;
  }

  async getResult(trackId: string): Promise<LyricsResult> {
    const job = this.jobsByTrack.get(trackId) || this.restoreFromTrack(trackId);
    if (!job) throw new NotFoundException("Lyrics job not found");
    if (job.status !== "done") throw new BadRequestException("Lyrics are not ready yet");
    const payload = await this.resolvePayload(job);
    if (!payload) throw new BadRequestException("Lyrics payload is missing");
    return { job, payload };
  }

  async getLrc(trackId: string): Promise<{ lrc: string; job: LyricsJobRecord }> {
    const job = this.jobsByTrack.get(trackId) || this.restoreFromTrack(trackId);
    if (!job) throw new NotFoundException("Lyrics job not found");
    if (job.status !== "done") throw new BadRequestException("Lyrics are not ready yet");
    const lrc = await this.resolveLrc(job);
    return { job, lrc };
  }

  private async consume(payload: LyricsQueuePayload) {
    const record = this.jobsByTrack.get(payload.trackId);
    if (record) {
      setJobStatus(record, "processing");
    }
    try {
      const result = await this.processor.handle(payload);
      this.payloadCache.set(payload.trackId, result.payload);
      this.lrcCache.set(payload.trackId, result.lrc);
      if (record) {
        record.provider = payload.provider;
        record.language = payload.language;
        record.resultJsonUrl = result.jsonUrl;
        record.lrcUrl = result.lrcUrl;
        setJobStatus(record, "done");
      }
      this.tracksService.setLyricsRefs(payload.trackId, {
        lrcUrl: result.lrcUrl,
        jsonUrl: result.jsonUrl,
        provider: payload.provider
      });
      return result;
    } catch (err: any) {
      this.markFailed(payload.trackId, err?.message || "Lyrics generation failed");
      throw err;
    }
  }

  private async resolvePayload(job: LyricsJobRecord): Promise<LyricsPayload | undefined> {
    const cached = this.payloadCache.get(job.trackId);
    if (cached) return cached;
    if (job.resultJsonUrl) {
      try {
        const res = await fetch(job.resultJsonUrl);
        if (res.ok) {
          const json = (await res.json()) as LyricsPayload;
          this.payloadCache.set(job.trackId, json);
          return json;
        }
      } catch {
        // ignore fetch errors, caller will receive undefined
      }
    }
    return undefined;
  }

  private async resolveLrc(job: LyricsJobRecord): Promise<string> {
    const cached = this.lrcCache.get(job.trackId);
    if (cached) return cached;
    if (!job.lrcUrl) throw new BadRequestException("LRC url is missing");
    const res = await fetch(job.lrcUrl);
    if (!res.ok) throw new BadRequestException("Failed to fetch LRC");
    const text = await res.text();
    this.lrcCache.set(job.trackId, text);
    return text;
  }

  private markFailed(trackId: string, reason: string) {
    const record = this.jobsByTrack.get(trackId);
    if (!record) return;
    setJobStatus(record, "error", reason || "Lyrics generation failed");
    this.payloadCache.delete(trackId);
    this.lrcCache.delete(trackId);
  }

  private restoreFromTrack(trackId: string): LyricsJobRecord | null {
    try {
      const track = this.tracksService.findOne(trackId) as any;
      if (!track?.lyricsLrcUrl && !track?.lyricsJsonUrl) return null;
      const now = new Date().toISOString();
      const restored: LyricsJobRecord = {
        id: `lyrics-${trackId}`,
        trackId,
        provider: track.lyricsProvider || "whisper",
        language: "auto",
        resultJsonUrl: track.lyricsJsonUrl || null,
        lrcUrl: track.lyricsLrcUrl || null,
        status: track.lyricsLrcUrl ? "done" : "queued",
        errorMessage: null,
        createdAt: track.lyricsUpdatedAt || now,
        updatedAt: track.lyricsUpdatedAt || now
      };
      this.jobsByTrack.set(trackId, restored);
      return restored;
    } catch {
      return null;
    }
  }

  private async processDirect(record: LyricsJobRecord, payload: LyricsQueuePayload) {
    setJobStatus(record, "processing");
    this.jobsByTrack.set(record.trackId, record);
    setImmediate(async () => {
      try {
        const result = await this.processor.handle(payload);
        this.payloadCache.set(payload.trackId, result.payload);
        this.lrcCache.set(payload.trackId, result.lrc);
        record.provider = payload.provider;
        record.language = payload.language;
        record.resultJsonUrl = result.jsonUrl;
        record.lrcUrl = result.lrcUrl;
        setJobStatus(record, "done");
        this.tracksService.setLyricsRefs(payload.trackId, {
          lrcUrl: result.lrcUrl,
          jsonUrl: result.jsonUrl,
          provider: payload.provider
        });
      } catch (err: any) {
        this.markFailed(payload.trackId, err?.message || "Lyrics generation failed");
      }
    });
  }
}
