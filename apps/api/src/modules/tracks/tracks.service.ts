import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CreateTrackDto } from "./dto/create-track.dto";
import { UpdateTrackDto } from "./dto/update-track.dto";
import { TrackDTO } from "@one-app/types";

@Injectable()
export class TracksService {
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
    const id = this.generateId();
    const track: TrackDTO = {
      ...dto,
      id,
      duration: dto.duration ?? 0,
      createdAt: new Date().toISOString(),
      tags: dto.tags ?? [],
      status: dto.status ?? "draft",
      popularity: (dto as any).popularity ?? 0
    };
    this.tracks.push(track);
    return track;
  }

  createMany(dtos: CreateTrackDto[]): TrackDTO[] {
    return dtos.map((dto) => this.create(dto));
  }

  update(id: string, dto: UpdateTrackDto): TrackDTO {
    const idx = this.tracks.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException("Track not found");
    this.tracks[idx] = { ...this.tracks[idx], ...dto };
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
}
