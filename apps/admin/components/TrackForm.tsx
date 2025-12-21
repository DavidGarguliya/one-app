"use client";
import { useEffect, useState } from "react";
import { Card, Input, Button } from "@one-app/ui";
import { adminApi } from "../lib/api";
import { parseBlob } from "music-metadata-browser";

type TrackFormProps = {
  trackId?: string;
  initial?: any;
};

const defaultStyleOptions = ["Поп", "Баллада", "Рок", "Lo-fi"];
const defaultMoodOptions = ["Радость", "Тепло", "Ностальгия", "Грусть"];
const defaultOccasionOptions = ["День рождения", "Любовь", "Свадьба", "Примирение"];
const defaultGenreOptions = ["Поп", "Рок", "Инди", "Электроника"];

export function TrackForm({ trackId, initial }: TrackFormProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => initial || {});
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.coverUrl || null);
  const [styleOptions, setStyleOptions] = useState<string[]>(defaultStyleOptions);
  const [moodOptions, setMoodOptions] = useState<string[]>(defaultMoodOptions);
  const [occasionOptions, setOccasionOptions] = useState<string[]>(defaultOccasionOptions);
  const [genreOptions, setGenreOptions] = useState<string[]>(defaultGenreOptions);

  useEffect(() => {
    if (initial) {
      setForm(initial);
      setCoverPreview(initial.coverUrl || null);
    }
  }, [initial]);

  useEffect(() => {
    let mounted = true;
    const normalize = (item: any) => {
      if (!item) return null;
      if (typeof item === "string") return item;
      return item.name || item.title || item.value || null;
    };
    const mergeUnique = (base: string[], incoming: any[]) => {
      const normalized = incoming.map(normalize).filter(Boolean) as string[];
      return Array.from(new Set([...base, ...normalized])).sort((a, b) => a.localeCompare(b, "ru"));
    };
    (async () => {
      try {
        const [styles, moods, occasions, tags] = await Promise.all([
          adminApi.listStyles().catch(() => []),
          adminApi.listMoods().catch(() => []),
          adminApi.listOccasions().catch(() => []),
          adminApi.listTags?.().catch(() => []) ?? []
        ]);
        if (!mounted) return;
        setStyleOptions((prev) => mergeUnique(prev, styles));
        setMoodOptions((prev) => mergeUnique(prev, moods));
        setOccasionOptions((prev) => mergeUnique(prev, occasions));
        const genres = Array.isArray(tags) ? tags.filter((t) => t?.type === "genre") : [];
        setGenreOptions((prev) => mergeUnique(prev, genres));
      } catch (err) {
        console.warn("Не удалось загрузить списки стилей/настроений/поводов", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAudio = async (file: File) => {
    try {
      const metadata = await parseBlob(file);
      if (metadata.common.title) setForm((f: any) => ({ ...f, title: metadata.common.title }));
      if (metadata.common.artist) setForm((f: any) => ({ ...f, artist: metadata.common.artist }));
      if (metadata.common.picture && metadata.common.picture[0]) {
        const pic = metadata.common.picture[0];
        const blob = new Blob([pic.data], { type: pic.format });
        const reader = new FileReader();
        reader.onload = () => {
          setCoverPreview(reader.result as string);
          setForm((f: any) => ({ ...f, coverUrl: reader.result as string, coverSource: "embedded" }));
        };
        reader.readAsDataURL(blob);
      }
      // audio to data URL
      const readerAudio = new FileReader();
      readerAudio.onload = () => {
        setForm((f: any) => ({ ...f, audioUrl: readerAudio.result as string }));
      };
      readerAudio.readAsDataURL(file);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCover = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result as string);
      setForm((f: any) => ({ ...f, coverUrl: reader.result as string, coverSource: "uploaded" }));
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const payload = {
        title: form.title || "",
        artist: form.artist || "",
        audioUrl: form.audioUrl || "",
        coverUrl: form.coverUrl || "",
        style: form.style || "",
        genre: form.genre || "",
        mood: form.mood || "",
        occasion: form.occasion || "",
        clientRequest: form.clientRequest || "",
        creationStory: form.creationStory || "",
        status: form.status || "draft",
        coverSource: form.coverSource || (form.coverUrl ? "uploaded" : undefined)
      };
      if (trackId) {
        await adminApi.updateTrack(trackId, payload);
        setStatus("Трек обновлён");
      } else {
        await adminApi.createTrack(payload);
        setStatus("Трек сохранён");
        setForm({});
        setCoverPreview(null);
      }
    } catch (err: any) {
      setStatus(err?.message || "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Card className="space-y-4 p-4 rounded-2xl">
        <h2 className="text-lg font-semibold">Аудио и обложка</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm text-[var(--fg)]/80">
            <span>Аудиофайл *</span>
            <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && handleAudio(e.target.files[0])} className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]" />
            <p className="text-xs text-[var(--muted)]">Название/исполнитель и обложка возьмутся из файла, если есть.</p>
          </label>
          <label className="space-y-2 text-sm text-[var(--fg)]/80">
            <span>Обложка (опционально)</span>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleCover(e.target.files[0])} className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]" />
            <p className="text-xs text-[var(--muted)]">Используется, если нет встроенной.</p>
            {coverPreview && <img src={coverPreview} alt="cover" className="h-24 rounded-xl object-cover" />}
          </label>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Input value={form.audioUrl || ""} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="Ссылка на аудио" />
          <Input value={form.coverUrl || ""} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} placeholder="Ссылка на обложку" />
        </div>
      </Card>

      <Card className="space-y-3 p-4 rounded-2xl">
        <h2 className="text-lg font-semibold text-[var(--fg)]">Основная информация</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Название трека" required />
          <Input value={form.artist || ""} onChange={(e) => setForm({ ...form, artist: e.target.value })} placeholder="Исполнитель" required />
          <label className="space-y-1 text-sm text-[var(--fg)]/80">
            <span>Стиль</span>
            <input
              value={form.style || ""}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              list="style-options"
              className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-[var(--fg)] focus:outline-none focus:ring-[var(--focus-ring)]"
              placeholder="Стиль"
            />
            <datalist id="style-options">
              {styleOptions.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
          </label>
          <label className="space-y-1 text-sm text-[var(--fg)]/80">
            <span>Настроение</span>
            <input
              value={form.mood || ""}
              onChange={(e) => setForm({ ...form, mood: e.target.value })}
              list="mood-options"
              className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-[var(--fg)] focus:outline-none focus:ring-[var(--focus-ring)]"
              placeholder="Настроение"
            />
            <datalist id="mood-options">
              {moodOptions.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
          </label>
          <label className="space-y-1 text-sm text-[var(--fg)]/80">
            <span>Повод</span>
            <input
              value={form.occasion || ""}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              list="occasion-options"
              className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-[var(--fg)] focus:outline-none focus:ring-[var(--focus-ring)]"
              placeholder="Повод"
            />
            <datalist id="occasion-options">
              {occasionOptions.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
          </label>
          <label className="space-y-1 text-sm text-[var(--fg)]/80">
            <span>Жанр</span>
            <input
              value={form.genre || ""}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              list="genre-options"
              className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-[var(--fg)] focus:outline-none focus:ring-[var(--focus-ring)]"
              placeholder="Жанр"
            />
            <datalist id="genre-options">
              {genreOptions.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
          </label>
        </div>
      </Card>

      <Card className="space-y-3 p-4 rounded-2xl">
        <h2 className="text-lg font-semibold text-[var(--fg)]">История и запрос</h2>
        <label className="space-y-2 text-sm text-[var(--fg)]/80">
          <span>Запрос клиента</span>
          <textarea value={form.clientRequest || ""} onChange={(e) => setForm({ ...form, clientRequest: e.target.value })} className="w-full rounded-2xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]" rows={3} placeholder="Оригинальная формулировка" />
        </label>
        <label className="space-y-2 text-sm text-[var(--fg)]/80">
          <span>История создания</span>
          <textarea value={form.creationStory || ""} onChange={(e) => setForm({ ...form, creationStory: e.target.value })} className="w-full rounded-2xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]" rows={5} placeholder="Этот текст увидит клиент" />
        </label>
      </Card>

      <Card className="space-y-3 p-4 rounded-2xl">
        <h2 className="text-lg font-semibold text-[var(--fg)]">Публикация</h2>
        <label className="space-y-1 text-sm text-[var(--fg)]/80">
          <span>Статус</span>
          <select value={form.status || "draft"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-[var(--fg)] focus:outline-none focus:ring-[var(--focus-ring)]">
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
          </select>
        </label>
        <div className="flex gap-2 items-center text-sm text-[var(--fg)]/80">
          <Button type="submit" disabled={loading}>{loading ? "Сохраняем..." : trackId ? "Сохранить изменения" : "Сохранить"}</Button>
          {status && <p className="text-sm text-[var(--muted)]">{status}</p>}
        </div>
      </Card>
    </form>
  );
}
