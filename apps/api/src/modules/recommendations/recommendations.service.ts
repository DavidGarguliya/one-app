import { Injectable } from "@nestjs/common";
import { PlaylistMatchResult, TrackDTO } from "@one-app/types";
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

type PlaylistConfig = {
  id: string;
  title: string;
  min_context_score: number;
  threshold_score: number;
  required_any_of?: {
    tags?: string[];
    moods?: string[];
    styles?: string[];
  };
  preferred?: {
    tags?: string[];
    moods?: string[];
    styles?: string[];
    genres?: string[];
    occasions?: string[];
  };
  excluded?: {
    tags?: string[];
    moods?: string[];
    styles?: string[];
    genres?: string[];
  };
};

@Injectable()
export class RecommendationsService {
  constructor(private readonly tracksService: TracksService) {}

  private normalizeText(text?: string) {
    if (!text) return "";
    return text.toLowerCase().trim().replace(/ё/g, "е");
  }

  private detectContextSignals(rawText: string) {
    const text = this.normalizeText(rawText);
    const short = text.length < 20;

    const hasAny = (words: string[]) => words.some((w) => text.includes(w));

    const addressingScore =
      (hasAny(["для тебя", "тебе", "тебя", "твою", "твой", "твоей"]) ? 10 : 0) +
      (hasAny(["ты ", "ты,", "тебя", "тебе", "твой", "твоего"]) ? 10 : 0);

    const storyScore =
      (hasAny(["родился", "родилась", "расстались", "расставание", "переехал", "переехала", "болезнь", "заболел", "потерял"]) ? 10 : 0) +
      (hasAny(["в прошлом году", "год назад", "тогда", "когда", "вчера", "сегодня", "завтра"]) ? 10 : 0) +
      (hasAny(["помню", "вспоминаю", "когда-то", "раньше"]) ? 5 : 0);

    const emotionalIntensityScore =
      (hasAny(["скучаю", "люблю", "больно", "горжусь", "тоскую", "страдаю", "счастлив", "дорог"]) ? 10 : 0) +
      (hasAny(["хочу поддержать", "хочу попросить", "хочу сказать", "хочу вернуть", "хочу извиниться"]) ? 10 : 0) +
      (hasAny(["очень", "сильно", "невыносимо", "ужасно", "так сильно"]) ? 10 : 0);

    const vulnerabilityScore =
      (hasAny(["прости", "извини", "виноват", "виновата", "простишь"]) ? 5 : 0) +
      (hasAny(["боюсь", "страшно", "не знаю как сказать", "сомневаюсь"]) ? 5 : 0) +
      (hasAny(["мне важно", "честно", "по-настоящему", "искренне"]) ? 5 : 0);

    if (short) {
      return {
        contextScore: 30,
        scores: { addressing: 0, story: 0, emotionalIntensity: 0, vulnerability: 0 }
      };
    }

    const contextScore = addressingScore + storyScore + emotionalIntensityScore + vulnerabilityScore;
    return {
      contextScore,
      scores: { addressing: addressingScore, story: storyScore, emotionalIntensity: emotionalIntensityScore, vulnerability: vulnerabilityScore }
    };
  }

  private enrichFromText(rawText: string) {
    const text = this.normalizeText(rawText);
    const add = {
      tags: new Set<string>(),
      moods: new Set<string>(),
      styles: new Set<string>()
    };

    const addAll = (collection: Set<string>, values: string[]) => values.forEach((v) => collection.add(v));

    if (/(далеко|расстояние|разлук|скучаю|жду|ждать|связь)/.test(text)) {
      addAll(add.tags, ["расстояние", "скучаю", "ожидание", "связь"]);
      addAll(add.moods, ["тоска", "надежда", "нежность"]);
      addAll(add.styles, ["камерный", "душевный", "атмосферный"]);
    }
    if (/(прости|извини|виноват|виновата|прощени|вина|простишь)/.test(text)) {
      addAll(add.tags, ["прости", "вина", "примирение"]);
      addAll(add.moods, ["искренность", "тоска", "надежда"]);
      addAll(add.styles, ["минималистичный", "интимный"]);
    }
    if (/(мама|папа|сын|дочь|ребен|ребён|семья)/.test(text)) {
      addAll(add.tags, ["семья"]);
      addAll(add.moods, ["тепло", "любовь", "безопасность"]);
      addAll(add.styles, ["светлый", "лиричный"]);
    }
    if (/(поддержать|рядом|держусь|держи|я с тобой|сложно|трудно|тяжело)/.test(text)) {
      addAll(add.tags, ["поддержка", "рядом"]);
      addAll(add.moods, ["поддержка", "спокойствие", "надежда"]);
      addAll(add.styles, ["камерный", "душевный"]);
    }
    if (/(новый этап|начать заново|снова|путь|выбор)/.test(text)) {
      addAll(add.tags, ["новый_этап", "путь", "выбор"]);
      addAll(add.moods, ["надежда", "вдохновение"]);
    }
    if (/(память|навсегда|след|время)/.test(text)) {
      addAll(add.tags, ["память", "навсегда", "время"]);
      addAll(add.moods, ["спокойствие", "благодарность"]);
    }
    if (/(напомнить|важно|между строк|не вслух|тишина)/.test(text)) {
      addAll(add.tags, ["напомнить", "важно", "между строк", "не вслух", "тишина"]);
      addAll(add.moods, ["искренность", "уверенность", "тепло"]);
      addAll(add.styles, ["минималистичный", "атмосферный"]);
    }
    if (/(пауза|возвращение)/.test(text)) {
      addAll(add.tags, ["пауза", "возвращение"]);
      addAll(add.moods, ["надежда"]);
    }

    return {
      tags: Array.from(add.tags),
      moods: Array.from(add.moods),
      styles: Array.from(add.styles)
    };
  }

  private toList(values: any): string[] {
    if (!values) return [];
    if (Array.isArray(values)) {
      return values
        .map((v) => {
          if (!v) return null;
          if (typeof v === "string") return v;
          if (typeof v === "object") return (v as any).name ?? (v as any).slug ?? null;
          return null;
        })
        .filter(Boolean) as string[];
    }
    return [String(values)];
  }

  private normalizeValues(values: string[]) {
    return Array.from(new Set(values.filter(Boolean).map((v) => this.normalizeText(v))));
  }

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

  private emotionalPlaylists: PlaylistConfig[] = [
    {
      id: "1",
      title: "Для тех, кто далеко",
      min_context_score: 60,
      required_any_of: { tags: ["расстояние", "скучаю", "ожидание", "связь"] },
      preferred: { moods: ["тоска", "нежность", "надежда"], styles: ["камерный", "душевный", "атмосферный"], genres: ["acoustic", "ballad", "cinematic"] },
      excluded: { moods: ["праздник", "драйв"] },
      threshold_score: 62
    },
    {
      id: "2",
      title: "Когда хочется сказать «прости»",
      min_context_score: 70,
      required_any_of: { tags: ["прости", "вина", "примирение"] },
      preferred: { moods: ["искренность", "тоска", "надежда"], styles: ["интимный", "минималистичный"] },
      excluded: { moods: ["праздник"] },
      threshold_score: 68
    },
    {
      id: "3",
      title: "Письмо ребёнку",
      min_context_score: 80,
      required_any_of: { tags: ["ребенок", "семья"] },
      preferred: { moods: ["тепло", "любовь", "безопасность"], styles: ["светлый", "искренний"], genres: ["acoustic", "cinematic", "classical"] },
      excluded: { genres: ["dance"] },
      threshold_score: 72
    },
    {
      id: "4",
      title: "Любовь без громких слов",
      min_context_score: 65,
      required_any_of: { moods: ["нежность", "близость"] },
      preferred: { styles: ["минималистичный", "интимный", "элегантный"], genres: ["acoustic", "jazz", "ballad"] },
      excluded: { tags: ["эпично", "триумф"] },
      threshold_score: 64
    },
    {
      id: "5",
      title: "Память",
      min_context_score: 75,
      required_any_of: { tags: ["память", "навсегда", "след"] },
      preferred: { moods: ["тоска", "благодарность", "спокойствие"], genres: ["cinematic", "classical", "ballad"] },
      excluded: { moods: ["праздник"] },
      threshold_score: 70
    },
    {
      id: "6",
      title: "Начать заново",
      min_context_score: 50,
      required_any_of: { tags: ["новый_этап", "путь", "выбор"] },
      preferred: { moods: ["надежда", "вдохновение", "вера в себя"], genres: ["pop", "cinematic", "electronic"] },
      excluded: {},
      threshold_score: 60
    },
    {
      id: "7",
      title: "Когда не хватает слов",
      min_context_score: 65,
      required_any_of: { moods: ["растерянность", "тоска", "нежность"] },
      preferred: { styles: ["интимный", "камерный"] },
      excluded: {},
      threshold_score: 63
    },
    {
      id: "8",
      title: "Сказать главное",
      min_context_score: 65,
      required_any_of: { tags: ["главное", "честно", "важно"] },
      preferred: { moods: ["искренность", "тепло"] },
      excluded: {},
      threshold_score: 62
    },
    {
      id: "9",
      title: "Между строк",
      min_context_score: 60,
      required_any_of: { tags: ["между строк", "тишина"] },
      preferred: { styles: ["минималистичный", "атмосферный"] },
      excluded: {},
      threshold_score: 60
    },
    {
      id: "10",
      title: "Для самых близких",
      min_context_score: 55,
      required_any_of: { tags: ["семья", "близкие"] },
      preferred: { moods: ["тепло", "любовь"] },
      excluded: {},
      threshold_score: 58
    },
    {
      id: "11",
      title: "Если бы ты был рядом",
      min_context_score: 65,
      required_any_of: { tags: ["рядом", "расстояние"] },
      preferred: { moods: ["тоска", "нежность"] },
      excluded: {},
      threshold_score: 64
    },
    {
      id: "12",
      title: "Тихое «я с тобой»",
      min_context_score: 60,
      required_any_of: { moods: ["поддержка", "тепло"] },
      preferred: { styles: ["камерный", "душевный"] },
      excluded: {},
      threshold_score: 60
    },
    {
      id: "13",
      title: "То, что остаётся",
      min_context_score: 70,
      required_any_of: { tags: ["навсегда", "память"] },
      preferred: { moods: ["спокойствие", "благодарность"] },
      excluded: {},
      threshold_score: 68
    },
    {
      id: "14",
      title: "Про нас",
      min_context_score: 55,
      required_any_of: { tags: ["мы", "вместе"] },
      preferred: { moods: ["любовь", "нежность"] },
      excluded: {},
      threshold_score: 58
    },
    {
      id: "15",
      title: "Нежно и по-настоящему",
      min_context_score: 60,
      required_any_of: { moods: ["нежность", "искренность"] },
      preferred: { styles: ["интимный", "светлый"] },
      excluded: {},
      threshold_score: 60
    },
    {
      id: "16",
      title: "Когда сердце знает",
      min_context_score: 60,
      required_any_of: { moods: ["уверенность", "любовь"] },
      preferred: { styles: ["лиричный"] },
      excluded: {},
      threshold_score: 60
    },
    {
      id: "17",
      title: "Не вслух",
      min_context_score: 65,
      required_any_of: { tags: ["не вслух", "про себя"] },
      preferred: { styles: ["минималистичный", "интимный"] },
      excluded: {},
      threshold_score: 63
    },
    {
      id: "18",
      title: "Для одного человека",
      min_context_score: 70,
      required_any_of: { tags: ["личное", "для тебя"] },
      preferred: { moods: ["близость", "искренность"] },
      excluded: {},
      threshold_score: 68
    },
    {
      id: "19",
      title: "То, что не отпускает",
      min_context_score: 75,
      required_any_of: { moods: ["тоска", "боль"] },
      preferred: { styles: ["глубокий", "атмосферный"] },
      excluded: {},
      threshold_score: 70
    },
    {
      id: "20",
      title: "С любовью и временем",
      min_context_score: 65,
      required_any_of: { tags: ["время", "путь"] },
      preferred: { moods: ["нежность", "спокойствие"] },
      excluded: {},
      threshold_score: 64
    },
    {
      id: "21",
      title: "Когда важно поддержать",
      min_context_score: 60,
      required_any_of: { moods: ["поддержка"] },
      preferred: { styles: ["душевный", "камерный"] },
      excluded: {},
      threshold_score: 60
    },
    {
      id: "22",
      title: "Прощание без боли",
      min_context_score: 75,
      required_any_of: { tags: ["прощание"] },
      preferred: { moods: ["спокойствие", "благодарность"] },
      excluded: {},
      threshold_score: 70
    },
    {
      id: "23",
      title: "Свет внутри",
      min_context_score: 55,
      required_any_of: { moods: ["надежда", "вдохновение"] },
      preferred: { styles: ["светлый"] },
      excluded: {},
      threshold_score: 58
    },
    {
      id: "24",
      title: "Дом, где ждут",
      min_context_score: 60,
      required_any_of: { tags: ["дом", "семья"] },
      preferred: { moods: ["тепло", "безопасность"] },
      excluded: {},
      threshold_score: 60
    },
    {
      id: "25",
      title: "Для себя настоящего",
      min_context_score: 50,
      required_any_of: { tags: ["я", "себя"] },
      preferred: { moods: ["честность", "спокойствие"] },
      excluded: {},
      threshold_score: 55
    },
    {
      id: "26",
      title: "После паузы",
      min_context_score: 55,
      required_any_of: { tags: ["пауза", "возвращение"] },
      preferred: { moods: ["надежда"] },
      excluded: {},
      threshold_score: 58
    },
    {
      id: "27",
      title: "Для мамы",
      min_context_score: 65,
      required_any_of: { tags: ["мама"] },
      preferred: { moods: ["благодарность", "любовь"] },
      excluded: {},
      threshold_score: 65
    },
    {
      id: "28",
      title: "Для папы",
      min_context_score: 65,
      required_any_of: { tags: ["папа"] },
      preferred: { moods: ["уважение", "тепло"] },
      excluded: {},
      threshold_score: 65
    },
    {
      id: "29",
      title: "Для ребёнка, когда вырастет",
      min_context_score: 80,
      required_any_of: { tags: ["ребенок", "будущее"] },
      preferred: { moods: ["надежда", "любовь"] },
      excluded: {},
      threshold_score: 75
    },
    {
      id: "30",
      title: "В день, который всё изменил",
      min_context_score: 75,
      required_any_of: { tags: ["перелом", "событие"] },
      preferred: { moods: ["память", "осознание"] },
      excluded: {},
      threshold_score: 72
    },
    {
      id: "31",
      title: "Когда начинается новая глава",
      min_context_score: 55,
      required_any_of: { tags: ["новый_этап"] },
      preferred: { moods: ["вдохновение", "легкость"] },
      excluded: {},
      threshold_score: 58
    },
    {
      id: "32",
      title: "Вместо тысячи сообщений",
      min_context_score: 60,
      required_any_of: { tags: ["вместо слов", "сообщение"] },
      preferred: { moods: ["искренность", "близость"] },
      excluded: {},
      threshold_score: 60
    },
    {
      id: "33",
      title: "Если вдруг станет тяжело",
      min_context_score: 65,
      required_any_of: { moods: ["тяжело", "боль"] },
      preferred: { moods: ["поддержка", "надежда"] },
      excluded: {},
      threshold_score: 65
    },
    {
      id: "34",
      title: "Когда нужно напомнить",
      min_context_score: 60,
      required_any_of: { tags: ["напомнить", "важно"] },
      preferred: { moods: ["уверенность", "тепло"] },
      excluded: {},
      threshold_score: 60
    },
    {
      id: "35",
      title: "Любовь, которая рядом",
      min_context_score: 55,
      required_any_of: { moods: ["любовь", "близость"] },
      preferred: { styles: ["камерный", "душевный"] },
      excluded: {},
      threshold_score: 58
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

  assignEmotionalPlaylists(track: TrackDTO): { contextScore: number; matches: PlaylistMatchResult[] } {
    const rawRequest =
      (track as any).client_request_text ??
      (track as any).clientRequest ??
      (track as any).clientRequestText ??
      (track as any).request ??
      (track as any).story ??
      "";

    const { contextScore, scores } = this.detectContextSignals(rawRequest);
    const enriched = this.enrichFromText(rawRequest);

    const tags = this.normalizeValues([...this.toList((track as any).tags), ...this.toList((track as any).tagIds), ...enriched.tags]);
    const moods = this.normalizeValues([...this.toList((track as any).moods ?? (track as any).mood), ...enriched.moods]);
    const styles = this.normalizeValues([...this.toList((track as any).styles ?? (track as any).style), ...enriched.styles]);
    const genres = this.normalizeValues(this.toList((track as any).genres ?? (track as any).genre));
    const occasions = this.normalizeValues(this.toList((track as any).occasions ?? (track as any).occasion));

    const calcMatch = (preferred: string[], actual: string[]) => {
      if (!preferred.length || !actual.length) return { matched: [], percent: 0 };
      const set = new Set(actual);
      const matched = preferred.filter((p) => set.has(this.normalizeText(p)));
      return {
        matched,
        percent: (matched.length / preferred.length) * 100
      };
    };

    const results: PlaylistMatchResult[] = [];

    for (const p of this.emotionalPlaylists) {
      const requiredTags = this.normalizeValues(p.required_any_of?.tags ?? []);
      const requiredMoods = this.normalizeValues(p.required_any_of?.moods ?? []);
      const requiredStyles = this.normalizeValues(p.required_any_of?.styles ?? []);

      const hasAnyRequiredValue =
        (requiredTags.length ? requiredTags.some((t) => tags.includes(this.normalizeText(t))) : false) ||
        (requiredMoods.length ? requiredMoods.some((m) => moods.includes(this.normalizeText(m))) : false) ||
        (requiredStyles.length ? requiredStyles.some((s) => styles.includes(this.normalizeText(s))) : false);

      const hasRequired =
        !requiredTags.length && !requiredMoods.length && !requiredStyles.length ? true : hasAnyRequiredValue;

      if (!hasRequired) {
        results.push({
          playlistId: p.id,
          playlistTitle: p.title,
          score: 0,
          explanation: {
            contextScore,
            contextSignals: scores,
            matched: { tags: [], moods: [], styles: [], genres: [], occasions: [] },
            gates: { passed: false, reason: "required_any_of" }
          }
        });
        continue;
      }

      if (contextScore < p.min_context_score) {
        results.push({
          playlistId: p.id,
          playlistTitle: p.title,
          score: 0,
          explanation: {
            contextScore,
            contextSignals: scores,
            matched: { tags: [], moods: [], styles: [], genres: [], occasions: [] },
            gates: { passed: false, reason: "context" }
          }
        });
        continue;
      }

      const excludedHit =
        (p.excluded?.tags ?? []).some((t) => tags.includes(this.normalizeText(t))) ||
        (p.excluded?.moods ?? []).some((m) => moods.includes(this.normalizeText(m))) ||
        (p.excluded?.styles ?? []).some((s) => styles.includes(this.normalizeText(s))) ||
        (p.excluded?.genres ?? []).some((g) => genres.includes(this.normalizeText(g)));

      if (excludedHit) {
        results.push({
          playlistId: p.id,
          playlistTitle: p.title,
          score: 0,
          explanation: {
            contextScore,
            contextSignals: scores,
            matched: { tags: [], moods: [], styles: [], genres: [], occasions: [] },
            gates: { passed: false, reason: "excluded" }
          }
        });
        continue;
      }

      const tagMatch = calcMatch(this.normalizeValues(p.preferred?.tags ?? []), tags);
      const moodMatch = calcMatch(this.normalizeValues(p.preferred?.moods ?? []), moods);
      const styleMatch = calcMatch(this.normalizeValues(p.preferred?.styles ?? []), styles);
      const genreMatch = calcMatch(this.normalizeValues(p.preferred?.genres ?? []), genres);
      const occasionMatch = calcMatch(this.normalizeValues(p.preferred?.occasions ?? []), occasions);

      const score =
        contextScore * 0.4 +
        moodMatch.percent * 0.2 +
        tagMatch.percent * 0.2 +
        styleMatch.percent * 0.1 +
        genreMatch.percent * 0.07 +
        occasionMatch.percent * 0.03;

      results.push({
        playlistId: p.id,
        playlistTitle: p.title,
        score,
        explanation: {
          contextScore,
          contextSignals: scores,
          matched: {
            tags: tagMatch.matched,
            moods: moodMatch.matched,
            styles: styleMatch.matched,
            genres: genreMatch.matched,
            occasions: occasionMatch.matched
          },
          gates: { passed: score >= p.threshold_score, reason: score >= p.threshold_score ? undefined : "below_threshold" }
        }
      });
    }

    const passed = results
      .filter((r) => r.score >= (this.emotionalPlaylists.find((p) => p.id === r.playlistId)?.threshold_score ?? 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return { contextScore, matches: passed };
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
