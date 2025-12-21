import { Injectable } from "@nestjs/common";
import { TrackDTO } from "@one-app/types";
import { TracksService } from "../tracks/tracks.service";

type AutoPlaylistDefinition = {
  type: "occasion" | "mood" | "style" | "combo";
  slug: string;
  title: string;
  description?: string;
  filter: (track: TrackDTO) => boolean;
  limit?: number;
};

type RelatedOptions = { limit?: number };

@Injectable()
export class RecommendationsService {
  constructor(private readonly tracksService: TracksService) {}

  private weights = {
    occasion: 3,
    mood: 2,
    style: 1,
    recency: 0.5,
    popularity: 0.5
  };

  private autoPlaylists: AutoPlaylistDefinition[] = [
    {
      type: "occasion",
      slug: "birthday",
      title: "День рождения",
      description: "Праздничные треки ко дню рождения",
      filter: (t) => (t.occasion || "").toLowerCase().includes("день р") || (t.occasion || "").toLowerCase().includes("birthday")
    },
    {
      type: "occasion",
      slug: "wedding",
      title: "Свадьба",
      description: "Романтичные истории для свадьбы",
      filter: (t) => (t.occasion || "").toLowerCase().includes("свад") || (t.occasion || "").toLowerCase().includes("wedding")
    },
    {
      type: "occasion",
      slug: "anniversary",
      title: "Годовщина",
      description: "Треки для годовщин и важных дат",
      filter: (t) => (t.occasion || "").toLowerCase().includes("годов") || (t.occasion || "").toLowerCase().includes("anniversary")
    },
    {
      type: "mood",
      slug: "romantic",
      title: "Романтика",
      filter: (t) => (t.mood || "").toLowerCase().includes("ром") || (t.mood || "").toLowerCase().includes("love")
    },
    {
      type: "mood",
      slug: "joy",
      title: "Радость",
      filter: (t) => (t.mood || "").toLowerCase().includes("рад") || (t.mood || "").toLowerCase().includes("joy")
    },
    {
      type: "mood",
      slug: "tender",
      title: "Нежность",
      filter: (t) => (t.mood || "").toLowerCase().includes("неж") || (t.mood || "").toLowerCase().includes("tender")
    },
    {
      type: "style",
      slug: "pop",
      title: "Поп",
      filter: (t) => (t.style || "").toLowerCase().includes("pop") || (t.genre || "").toLowerCase().includes("pop")
    },
    {
      type: "style",
      slug: "acoustic",
      title: "Акустика",
      filter: (t) => (t.style || "").toLowerCase().includes("акуст") || (t.style || "").toLowerCase().includes("acoustic")
    },
    {
      type: "style",
      slug: "ballad",
      title: "Баллады",
      filter: (t) => (t.style || "").toLowerCase().includes("балл") || (t.style || "").toLowerCase().includes("ballad")
    },
    {
      type: "combo",
      slug: "love-warm",
      title: "Любовь и тепло",
      description: "Комбинация повода и настроения",
      filter: (t) =>
        ((t.occasion || "").toLowerCase().includes("люб") || (t.occasion || "").toLowerCase().includes("свад")) &&
        ((t.mood || "").toLowerCase().includes("тепл") || (t.mood || "").toLowerCase().includes("ром"))
    }
  ];

  getRelated(trackId: string, options: RelatedOptions = {}) {
    const source = this.tracksService.findOne(trackId);
    const candidates = this.tracksService.getPublished().filter((t) => t.id !== source.id);
    const scored = candidates
      .map((track) => ({
        track,
        score: this.scoreTrack(source, track)
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const limit = options.limit ?? 8;
    return scored.slice(0, limit).map((s) => s.track);
  }

  getAutoPlaylists() {
    return this.autoPlaylists.map((p) => ({
      type: p.type,
      slug: p.slug,
      title: p.title,
      description: p.description
    }));
  }

  getAutoPlaylist(type: string, slug: string) {
    const definition = this.autoPlaylists.find((p) => p.type === type && p.slug === slug);
    if (!definition) return null;
    const tracks = this.tracksService
      .getPublished()
      .filter((t) => definition.filter(t))
      .sort((a, b) => this.popularity(b) - this.popularity(a) || this.recency(b) - this.recency(a));

    const limit = definition.limit ?? 50;
    return {
      type: definition.type,
      slug: definition.slug,
      title: definition.title,
      description: definition.description,
      tracks: tracks.slice(0, limit)
    };
  }

  private scoreTrack(source: TrackDTO, candidate: TrackDTO) {
    let score = 0;
    const matchOccasion = source.occasion && candidate.occasion && source.occasion.toLowerCase() === candidate.occasion.toLowerCase();
    const matchMood = source.mood && candidate.mood && source.mood.toLowerCase() === candidate.mood.toLowerCase();
    const matchStyle = source.style && candidate.style && source.style.toLowerCase() === candidate.style.toLowerCase();
    if (matchOccasion) score += this.weights.occasion;
    if (matchMood) score += this.weights.mood;
    if (matchStyle) score += this.weights.style;
    score += this.recency(candidate) * this.weights.recency;
    score += this.popularity(candidate) * this.weights.popularity;
    return score;
  }

  private recency(track: TrackDTO) {
    const created = track.createdAt ? new Date(track.createdAt).getTime() : 0;
    if (!created) return 0;
    const now = Date.now();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    // 0..1 within ~180 days window
    return Math.max(0, Math.min(1, 1 - diffDays / 180));
  }

  private popularity(track: TrackDTO) {
    // ожидаем track.popularity (прослушивания/дослушивания), fallback 0
    const pop = (track as any).popularity ?? 0;
    return Math.max(0, Math.min(1, pop / 100)); // нормализация: 100+ прослушиваний → 1
  }
}
