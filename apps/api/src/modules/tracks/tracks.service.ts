import { Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CreateTrackDto } from "./dto/create-track.dto";
import { UpdateTrackDto } from "./dto/update-track.dto";
import { TrackDTO, LyricsProvider } from "@one-app/types";
import { TagsService } from "../tags/tags.service";
import { PlaylistsService } from "../playlists/playlists.service";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const API_BASE =
  (process.env.API_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000").replace(
    /\/$/,
    ""
  );

const proxifyAudioUrl = (url?: string): string => {
  if (!url) return "";
  try {
    const s3 = new URL(S3_ENDPOINT);
    const parsed = new URL(url);
    if (parsed.hostname === s3.hostname && parsed.port === s3.port) {
      return `${API_BASE}/v1/tracks/proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // ignore parse errors and return original
  }
  if (url.startsWith("http://localhost:9000/")) {
    return `${API_BASE}/v1/tracks/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

@Injectable()
export class TracksService {
  constructor(
    private readonly tagsService: TagsService,
    @Inject(forwardRef(() => PlaylistsService)) private readonly playlistsService: PlaylistsService
  ) {}

  private tracks: TrackDTO[] = [];
  private counter = 0;
  private normalized = false;

  private generateId(): string {
    if (typeof randomUUID === "function") {
      return randomUUID();
    }
    const ts = Date.now();
    const suffix = (this.counter++).toString(36);
    return `track-${ts}-${suffix}`;
  }

  private ensureUniqueIds() {
    if (this.normalized) return;
    const used = new Set<string>();
    this.tracks = this.tracks.map((t) => {
      let id = t.id;
      if (!id || used.has(id)) {
        id = this.generateId();
      }
      used.add(id);
      return { ...t, id };
    });
    this.normalized = true;
  }

  findAll(filters?: { genre?: string; occasion?: string }): TrackDTO[] {
    this.ensureUniqueIds();
    let res = this.tracks;
    if (filters?.genre) res = res.filter((t) => t.genre === filters.genre);
    if (filters?.occasion) res = res.filter((t) => t.occasion === filters.occasion);
    return res;
  }

  getPublished(): TrackDTO[] {
    this.ensureUniqueIds();
    return this.tracks.filter((t) => (t as any).status === "published");
  }

  findOne(id: string): TrackDTO {
    const found = this.tracks.find((t) => t.id === id);
    if (!found) throw new NotFoundException("Track not found");
    return found;
  }

  create(dto: CreateTrackDto): TrackDTO {
    if (dto.genre) {
      this.tagsService.ensureGenresFromList([dto.genre]);
    }
    const id = this.generateId();
    const track: TrackDTO = {
      ...dto,
      id,
      audioUrl: proxifyAudioUrl(dto.audioUrl),
      duration: dto.duration ?? 0,
      createdAt: new Date().toISOString(),
      tags: dto.tags ?? [],
      status: dto.status ?? "draft",
      popularity: (dto as any).popularity ?? 0
    };
    this.tracks.push(track);
    this.playlistsService.addToLatest(track.id);
    return track;
  }

  createMany(dtos: CreateTrackDto[]): TrackDTO[] {
    dtos.forEach((dto) => {
      if (dto.genre) this.tagsService.ensureGenresFromList([dto.genre]);
    });
    const created = dtos.map((dto) => this.create({ ...dto, audioUrl: proxifyAudioUrl(dto.audioUrl) }));
    created.forEach((t) => this.playlistsService.addToLatest(t.id));
    return created;
  }

  update(id: string, dto: UpdateTrackDto): TrackDTO {
    const idx = this.tracks.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException("Track not found");
    this.tracks[idx] = { ...this.tracks[idx], ...dto, audioUrl: dto.audioUrl ? proxifyAudioUrl(dto.audioUrl) : this.tracks[idx].audioUrl };
    return this.tracks[idx];
  }

  remove(id: string) {
    const idx = this.tracks.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException("Track not found");
    this.tracks.splice(idx, 1);
    return { success: true };
  }

  getFeatured(): TrackDTO | null {
    this.ensureUniqueIds();
    return this.tracks.length ? this.tracks[this.tracks.length - 1] : null;
  }

  getLatest(limit = 8): TrackDTO[] {
    this.ensureUniqueIds();
    return [...this.tracks].slice(-limit).reverse();
  }

  setLyricsRefs(trackId: string, payload: { lrcUrl: string | null; jsonUrl: string | null; provider: LyricsProvider; updatedAt?: string }) {
    const idx = this.tracks.findIndex((t) => t.id === trackId);
    if (idx === -1) return;
    const updatedAt = payload.updatedAt || new Date().toISOString();
    this.tracks[idx] = {
      ...this.tracks[idx],
      lyricsLrcUrl: payload.lrcUrl,
      lyricsJsonUrl: payload.jsonUrl,
      lyricsProvider: payload.provider,
      lyricsUpdatedAt: updatedAt
    };
  }
}
