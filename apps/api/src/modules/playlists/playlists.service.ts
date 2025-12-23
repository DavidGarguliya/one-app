import { Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";
import { UpdatePlaylistDto } from "./dto/update-playlist.dto";
import { PlaylistDTO } from "@one-app/types";
import { TracksService } from "../tracks/tracks.service";

@Injectable()
export class PlaylistsService {
  constructor(@Inject(forwardRef(() => TracksService)) private readonly tracksService: TracksService) {}

  private sanitizeTrackIds(trackIds?: any[]): string[] {
    if (!Array.isArray(trackIds)) return [];
    const uniq = new Set<string>();
    trackIds
      .map((t) => (t ? String(t) : ""))
      .filter(Boolean)
      .forEach((id) => uniq.add(id));
    return Array.from(uniq);
  }

  private composeCover(trackIds: string[] = [], explicitCover?: string) {
    if (explicitCover) {
      return { coverUrl: explicitCover, coverGrid: undefined };
    }
    const tracks = trackIds
      .map((id) => {
        try {
          return this.tracksService.findOne(id);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as { coverUrl?: string }[];
    const lastCovers: string[] = tracks
      .map((t) => t.coverUrl)
      .filter((c): c is string => Boolean(c))
      .slice(-4);

    if (lastCovers.length) {
      return { coverUrl: lastCovers[0] as string, coverGrid: lastCovers };
    }

    const fallback =
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80";
    return { coverUrl: fallback, coverGrid: undefined };
  }

  private readonly defaults: PlaylistDTO[] = [
    "Для тех, кто далеко",
    "Когда хочется сказать «прости»",
    "Письмо ребёнку",
    "Любовь без громких слов",
    "Память",
    "Начать заново",
    "Когда не хватает слов",
    "Сказать главное",
    "Между строк",
    "Для самых близких",
    "Если бы ты был рядом",
    "Тихое «я с тобой»",
    "То, что остаётся",
    "Про нас",
    "Нежно и по-настоящему",
    "Когда сердце знает",
    "Не вслух",
    "Для одного человека",
    "То, что не отпускает",
    "С любовью и временем",
    "Когда важно поддержать",
    "Прощание без боли",
    "Свет внутри",
    "Дом, где ждут",
    "Для себя настоящего",
    "После паузы",
    "Для мамы",
    "Для папы",
    "Для ребёнка, когда вырастет",
    "В день, который всё изменил",
    "Когда начинается новая глава",
    "Вместо тысячи сообщений",
    "Если вдруг станет тяжело",
    "Когда нужно напомнить",
    "Любовь, которая рядом"
  ].map((title, idx) => ({
    id: `pl-${idx + 1}`,
    title,
    description: "",
    coverUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    trackIds: [],
    status: "published",
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  }));

  private playlists: PlaylistDTO[] = [...this.defaults];

  private getLatestPlaylistId() {
    const existing = this.playlists.find((p) => p.title.toLowerCase() === "последние добавленные");
    if (existing) return existing.id;
    const latest: PlaylistDTO = {
      id: `pl-latest`,
      title: "Последние добавленные",
      description: "Автоматически наполняется новыми треками",
      coverUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      trackIds: [],
      status: "published",
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };
    this.playlists.unshift(latest);
    return latest.id;
  }

  addToLatest(trackId: string) {
    const latestId = this.getLatestPlaylistId();
    const idx = this.playlists.findIndex((p) => p.id === latestId);
    if (idx === -1) return;
    const set = new Set(this.playlists[idx].trackIds);
    set.add(trackId);
    this.playlists[idx] = { ...this.playlists[idx], trackIds: Array.from(set) };
  }

  findAll(): PlaylistDTO[] {
    return this.playlists;
  }

  findOne(id: string): PlaylistDTO {
    const found = this.playlists.find((p) => p.id === id);
    if (!found) throw new NotFoundException("Playlist not found");
    return found;
  }

  create(dto: CreatePlaylistDto) {
    const trackIds = this.sanitizeTrackIds(dto.trackIds);
    const explicitCover = dto.coverUrl === "" ? undefined : dto.coverUrl;
    const { coverUrl, coverGrid } = this.composeCover(trackIds, explicitCover);
    const playlist: PlaylistDTO = {
      ...dto,
      id: `pl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: dto.status ?? "draft",
      coverUrl,
      coverGrid,
      trackIds
    };
    this.playlists.push(playlist);
    return playlist;
  }

  update(id: string, dto: UpdatePlaylistDto) {
    const idx = this.playlists.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundException("Playlist not found");
    const mergedTrackIds = dto.trackIds !== undefined ? this.sanitizeTrackIds(dto.trackIds) : this.playlists[idx].trackIds;
    const hadGeneratedGrid = Boolean(this.playlists[idx].coverGrid?.length);
    const trackIdsChanged = dto.trackIds !== undefined;
    const coverClear = dto.coverUrl === "";
    const coverProvided = typeof dto.coverUrl === "string" && dto.coverUrl !== "";

    let explicitCover: string | undefined;
    if (coverClear) {
      explicitCover = undefined;
    } else if (coverProvided) {
      explicitCover = dto.coverUrl as string;
    } else if (dto.coverUrl === undefined) {
      explicitCover = hadGeneratedGrid || trackIdsChanged ? undefined : this.playlists[idx].coverUrl;
    }

    const { coverUrl, coverGrid } = this.composeCover(mergedTrackIds, explicitCover);
    this.playlists[idx] = { ...this.playlists[idx], ...dto, trackIds: mergedTrackIds, coverUrl, coverGrid };
    return this.playlists[idx];
  }

  remove(id: string) {
    const idx = this.playlists.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundException("Playlist not found");
    this.playlists.splice(idx, 1);
    return { success: true };
  }
}
