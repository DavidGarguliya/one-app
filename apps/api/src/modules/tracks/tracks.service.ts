import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTrackDto } from "./dto/create-track.dto";
import { UpdateTrackDto } from "./dto/update-track.dto";
import { TrackDTO } from "@one-app/types";

@Injectable()
export class TracksService {
  private tracks: TrackDTO[] = [];

  findAll(filters?: { genre?: string; occasion?: string }): TrackDTO[] {
    let res = this.tracks;
    if (filters?.genre) res = res.filter((t) => t.genre === filters.genre);
    if (filters?.occasion) res = res.filter((t) => t.occasion === filters.occasion);
    return res;
  }

  getPublished(): TrackDTO[] {
    return this.tracks.filter((t) => (t as any).status === "published");
  }

  findOne(id: string): TrackDTO {
    const found = this.tracks.find((t) => t.id === id);
    if (!found) throw new NotFoundException("Track not found");
    return found;
  }

  create(dto: CreateTrackDto): TrackDTO {
    const track: TrackDTO = {
      ...dto,
      id: `track-${Date.now()}`,
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
    return this.tracks.length ? this.tracks[this.tracks.length - 1] : null;
  }

  getLatest(limit = 8): TrackDTO[] {
    return [...this.tracks].slice(-limit).reverse();
  }
}
