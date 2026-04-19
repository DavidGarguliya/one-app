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
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

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

  const guessAudioMime = (file: File) => {
    if (file.type) return file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "m4a":
        return "audio/x-m4a";
      case "mp4":
        return "audio/mp4";
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "aiff":
      case "aif":
        return "audio/aiff";
      default:
        return "application/octet-stream";
    }
  };

  const readAsArrayBuffer = (file: File) =>
    new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    });

  const readAsDataUrl = (blob: Blob, mimeOverride?: string) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
      const source = mimeOverride ? new Blob([blob], { type: mimeOverride }) : blob;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(source);
    });

  const encodeWav = (audioBuffer: AudioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + length * blockAlign);
    const view = new DataView(buffer);

    let offset = 0;
    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i += 1) view.setUint8(offset + i, s.charCodeAt(i));
      offset += s.length;
    };
    writeString("RIFF");
    view.setUint32(offset, 36 + length * blockAlign, true); offset += 4;
    writeString("WAVE");

    writeString("fmt ");
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
    view.setUint16(offset, blockAlign, true); offset += 2;
    view.setUint16(offset, bytesPerSample * 8, true); offset += 2;

    writeString("data");
    view.setUint32(offset, length * blockAlign, true); offset += 4;

    const channelData = Array.from({ length: numChannels }, (_, ch) => audioBuffer.getChannelData(ch));
    for (let i = 0; i < length; i += 1) {
      for (let ch = 0; ch < numChannels; ch += 1) {
        const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([view], { type: "audio/wav" });
  };

  const toBrowserPlayableDataUrl = async (file: File, fallbackMime: string) => {
    if (typeof window === "undefined") return readAsDataUrl(file, fallbackMime);
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return readAsDataUrl(file, fallbackMime);
    try {
      const arr = await readAsArrayBuffer(file);
      const ctx = new AudioCtx();
      const decoded = await ctx.decodeAudioData(arr.slice(0));
      const wav = encodeWav(decoded);
      const dataUrl = await readAsDataUrl(wav, "audio/wav");
      if (typeof ctx.close === "function") ctx.close();
      return dataUrl;
    } catch (err) {
      console.warn("Не удалось перекодировать в WAV, используем оригинал", err);
      return readAsDataUrl(file, fallbackMime);
    }
  };

  const handleAudio = async (file: File) => {
    try {
      const metadata = await parseBlob(file);
      if (metadata.common.title) setForm((f: any) => ({ ...f, title: metadata.common.title }));
      if (metadata.common.artist) setForm((f: any) => ({ ...f, artist: metadata.common.artist }));
      if (typeof metadata.format?.duration === "number") {
        setForm((f: any) => ({ ...f, duration: Math.round(metadata.format.duration ?? 0) }));
      }
      if (metadata.common.picture && metadata.common.picture[0]) {
        const pic = metadata.common.picture[0];
        const safePicBuffer = new Uint8Array(pic.data).buffer;
        const blob = new Blob([safePicBuffer], { type: pic.format });
        const reader = new FileReader();
        reader.onload = () => {
          setCoverPreview(reader.result as string);
          setForm((f: any) => ({ ...f, coverUrl: reader.result as string, coverSource: "embedded" }));
        };
        reader.readAsDataURL(blob);
      }
      // audio to data URL (convert to WAV for broader compatibility)
      const mime = guessAudioMime(file);
      const audioUrl = await toBrowserPlayableDataUrl(file, mime);
      setForm((f: any) => ({ ...f, audioUrl }));
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
        coverSource: form.coverSource || (form.coverUrl ? "uploaded" : undefined),
        duration: form.duration
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

  const loadAudioUrl = async () => {
    if (!trackId) return;
    setAudioLoading(true);
    setAudioError(null);
    try {
      const full = await adminApi.getTrack(trackId);
      if (!full?.audioUrl) {
        setAudioError("Не удалось получить audioUrl");
        return;
      }
      setForm((prev: any) => ({ ...prev, audioUrl: full.audioUrl }));
      if (full.duration && !form.duration) {
        setForm((prev: any) => ({ ...prev, duration: full.duration }));
      }
    } catch (err: any) {
      setAudioError(err?.message || "Не удалось загрузить audioUrl");
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Card className="space-y-4 p-4 rounded-2xl">
        <h2 className="text-lg font-semibold">Аудио и обложка</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm text-[var(--fg)]/80">
            <span>Аудиофайл *</span>
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aiff,audio/x-aiff,audio/mp4,audio/x-m4a,audio/m4a,audio/*"
              onChange={(e) => e.target.files?.[0] && handleAudio(e.target.files[0])}
              className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]"
            />
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
          <div className="space-y-2">
            <Input value={form.audioUrl || ""} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="Ссылка на аудио" />
            {trackId && !form.audioUrl && (
              <button
                type="button"
                onClick={loadAudioUrl}
                className="text-xs text-[var(--accent)] hover:text-[var(--accent-strong)]"
                disabled={audioLoading}
              >
                {audioLoading ? "Загружаем audioUrl..." : "Подгрузить сохранённый audioUrl"}
              </button>
            )}
            {audioError && <p className="text-xs text-red-400">{audioError}</p>}
          </div>
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
