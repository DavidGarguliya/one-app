"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import { Button, Card, Input } from "@one-app/ui";
import { parseBlob } from "music-metadata-browser";

type ParsedTrack = {
  id: string;
  fileName: string;
  loading: boolean;
  error?: string;
  data: {
    title: string;
    artist: string;
    album?: string;
    year?: string;
    genre?: string;
    audioUrl: string;
    coverUrl?: string;
    coverSource?: "embedded" | "uploaded";
    style?: string;
    mood?: string;
    occasion?: string;
    duration?: number;
  };
};

const MAX_AUDIO_INLINE_BYTES = 150 * 1024 * 1024; // ~150MB raw (~200MB base64)
const INLINE_SAFETY_BYTES = 120 * 1024 * 1024; // выше — лучше грузить на API, чтобы избежать Invalid string length
const isLossy = (mime: string) => /(mp3|mpeg|m4a|mp4)/i.test(mime);

const readAsDataUrl = (blob: Blob, mimeOverride?: string) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    const source = mimeOverride ? new Blob([blob], { type: mimeOverride }) : blob;
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(source);
  });

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

const blobToDataUrl = (data: Uint8Array, type: string) =>
  new Promise<string>((resolve) => {
    // Create a detached copy to guarantee ArrayBuffer (not SharedArrayBuffer).
    const safeCopy = new Uint8Array(data).buffer;
    const blob = new Blob([safeCopy], { type });
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

const uploadFile = async (file: Blob, fileName: string) => {
  const form = new FormData();
  form.append("file", file, fileName);
  const bases = [
    (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""),
    typeof window !== "undefined" ? window.location.origin : "",
    "http://localhost:4000"
  ].filter(Boolean);
  const tried: string[] = [];
  for (const base of bases) {
    const target = `${base}/v1/tracks/upload`;
    tried.push(target);
    try {
      const res = await fetch(target, { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed (${res.status})`);
      }
      const json = await res.json();
      const direct = json.originalUrl || json.url;
      if (!direct) throw new Error("Сервер не вернул ссылку на файл");
      return direct as string;
    } catch (err) {
      // try next base
      continue;
    }
  }
  throw new Error(`Не удалось загрузить файл на сервер (${tried.join(", ")})`);
};

const readAsArrayBuffer = (file: File) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });

const encodeWav = (audioBuffer: AudioBuffer) => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + length * blockAlign);
  const view = new DataView(buffer);

  // RIFF header
  let offset = 0;
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i += 1) view.setUint8(offset + i, s.charCodeAt(i));
    offset += s.length;
  };
  writeString("RIFF");
  view.setUint32(offset, 36 + length * blockAlign, true); offset += 4; // chunk size
  writeString("WAVE");

  // fmt chunk
  writeString("fmt ");
  view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size
  view.setUint16(offset, 1, true); offset += 2; // PCM
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true); offset += 4; // byte rate
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bytesPerSample * 8, true); offset += 2;

  // data chunk
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

const prepareAudioUrl = async (file: File, mime: string, shouldUpload: boolean) => {
  if (shouldUpload) {
    // Для AIFF/m4a и крупных файлов не делаем inline fallback, чтобы избежать Invalid string length.
    return uploadFile(file, file.name);
  }
  if (isLossy(mime)) return readAsDataUrl(file, mime);
  return toBrowserPlayableDataUrl(file, mime);
};

export default function TracksMassUploadPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dirInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<ParsedTrack[]>([]);
  const [parsing, setParsing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("published");
  const defaultStyles = ["Pop", "Rock", "Lo-fi", "Acoustic"];
  const defaultMoods = ["Happy", "Calm", "Sad", "Romantic"];
  const defaultOccasions = ["Birthday", "Wedding", "Anniversary", "Thank you"];
  const defaultGenres = ["Pop", "Rock", "Electronic", "Classical", "Jazz"];

  const [styleOptions, setStyleOptions] = useState<string[]>(defaultStyles);
  const [moodOptions, setMoodOptions] = useState<string[]>(defaultMoods);
  const [occasionOptions, setOccasionOptions] = useState<string[]>(defaultOccasions);
  const [genreOptions, setGenreOptions] = useState<string[]>(defaultGenres);

  const parsedCount = useMemo(() => items.filter((i) => !i.loading && !i.error).length, [items]);

  useEffect(() => {
    // Enable directory selection across browsers
    if (dirInputRef.current) {
      dirInputRef.current.setAttribute("webkitdirectory", "true");
      dirInputRef.current.setAttribute("directory", "true");
      dirInputRef.current.setAttribute("mozdirectory", "true");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const normalize = (item: any) => {
      if (!item) return null;
      if (typeof item === "string") return item;
      return item.name || item.title || item.value || null;
    };
    const mergeUnique = (incoming: any[]) => {
      const normalized = incoming.map(normalize).filter(Boolean) as string[];
      return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b, "ru"));
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
        setStyleOptions(mergeUnique(styles));
        setMoodOptions(mergeUnique(moods));
        setOccasionOptions(mergeUnique(occasions));
        const genres = Array.isArray(tags) ? tags.filter((t) => t?.type === "genre") : [];
        setGenreOptions(mergeUnique(genres));
      } catch (err) {
        console.warn("Не удалось загрузить справочники", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    const filtered = Array.from(fileList).filter((file) => {
      const path = (file as any).webkitRelativePath || file.name;
      return !path.split("/").some((seg: string) => seg.startsWith("."));
    });
    if (!filtered.length) return;
    setParsing(true);
    setStatus(null);
    const files = filtered;

    const next: ParsedTrack[] = files.map((file, idx) => ({
      id: `${file.name}-${idx}-${Date.now()}`,
      fileName: file.name,
      loading: true,
      data: { title: file.name.replace(/\.[^.]+$/, ""), artist: "", audioUrl: "" }
    }));
    setItems(next);

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      try {
        if (file.size > MAX_AUDIO_INLINE_BYTES) {
          const mb = Math.round((file.size / 1024 / 1024) * 10) / 10;
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    loading: false,
                    error: `Файл ${mb} МБ слишком большой для inline (лимит ~${Math.round(
                      MAX_AUDIO_INLINE_BYTES / 1024 / 1024
                    )} МБ)`
                  }
                : it
            )
          );
          continue;
        }
        const metadata = await parseBlob(file);
        const audioMime = guessAudioMime(file);
        const shouldUpload = /(aiff|m4a|mp4)/i.test(audioMime) || file.size > INLINE_SAFETY_BYTES;
        let audioUrl: string;
        try {
          audioUrl = await prepareAudioUrl(file, audioMime, shouldUpload);
        } catch (err: any) {
          const reason = err?.message || "Браузер не смог подготовить аудио";
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    loading: false,
                    error: `${reason}. Файл может быть слишком большим для inline.`
                  }
                : it
            )
          );
          continue;
        }
        const title = metadata.common.title || file.name.replace(/\.[^.]+$/, "");
        const artist = metadata.common.artist || "";
        const album = metadata.common.album || "";
        const year = metadata.common.year ? String(metadata.common.year) : metadata.common.date || "";
        const duration = metadata.format?.duration ? Math.round(metadata.format.duration) : undefined;
        const cover = metadata.common.picture?.[0];
        const coverUrl = cover
          ? await blobToDataUrl(cover.data, cover.format || "image/jpeg")
          : undefined;

        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  loading: false,
                  error: undefined,
                  data: {
                    ...it.data,
                    title,
                    artist,
                    album,
                    year: year || undefined,
                    genre: metadata.common.genre?.[0] || "",
                    audioUrl,
                    coverUrl,
                    coverSource: coverUrl ? "embedded" : undefined,
                    duration
                  }
                }
              : it
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, loading: false, error: err?.message || "Не удалось прочитать файл" } : it
          )
        );
      }
    }

    setParsing(false);
  };

  const updateItem = (id: string, patch: Partial<ParsedTrack["data"]>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, data: { ...it.data, ...patch }, error: undefined } : it))
    );
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const payload = items
        .filter((it) => !it.loading && !it.error)
        .map((it) => ({
          title: it.data.title || it.fileName,
          artist: it.data.artist || "Unknown",
          album: it.data.album || undefined,
          genre: it.data.genre || undefined,
          audioUrl: it.data.audioUrl,
          coverUrl: it.data.coverUrl || "",
          coverSource: it.data.coverSource || (it.data.coverUrl ? "uploaded" : undefined),
          status: publishStatus,
          year: it.data.year || undefined,
          style: it.data.style || undefined,
          mood: it.data.mood || undefined,
          occasion: it.data.occasion || undefined,
          duration: it.data.duration
        }));

      if (!payload.length) {
        setStatus("Нет треков для сохранения");
        return;
      }

      await adminApi.createTracksBulk(payload);
      setStatus(`Сохранено треков: ${payload.length}`);
      setItems([]);
    } catch (err: any) {
      setStatus(err?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--fg)]">Массовая загрузка треков</h1>
          <p className="text-sm text-[var(--muted)]">
            Загрузите десятки файлов сразу (mp3, wav, aiff) — мы распарсим метаданные, обложки и дадим отредактировать перед сохранением.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--fg)]/80 flex items-center gap-2">
            Статус:
            <select
              value={publishStatus}
              onChange={(e) => setPublishStatus(e.target.value as "draft" | "published")}
              className="rounded-lg bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-2 py-1 text-sm"
            >
              <option value="draft">Черновик</option>
              <option value="published">Опубликован</option>
            </select>
          </label>
          <Button variant="ghost" onClick={() => setItems([])} disabled={!items.length}>
            Очистить список
          </Button>
        </div>
      </div>

      <Card className="space-y-3 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            Выбрать файлы
          </Button>
          <Button type="button" variant="ghost" onClick={() => dirInputRef.current?.click()}>
            Выбрать папку
          </Button>
          <span className="text-xs text-[var(--muted)]">
            Поддержка более 50 файлов. Папки разворачиваются рекурсивно, скрытые файлы и каталоги (начинающиеся с «.») игнорируются.
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aiff,audio/x-aiff,audio/mp4,audio/x-m4a,audio/m4a,audio/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <input
          ref={dirInputRef}
          type="file"
          multiple
          accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aiff,audio/x-aiff,audio/mp4,audio/x-m4a,audio/m4a,audio/*"
          onChange={(e) => handleFiles(e.target.files)}
          // allow full directory pick in all browsers
          // @ts-expect-error non-standard attributes for directory selection
          webkitdirectory="true"
          directory="true"
          mozdirectory="true"
          className="hidden"
        />
        {parsing && <p className="text-sm text-[var(--muted)]">Парсим файлы, пожалуйста, подождите…</p>}
        {status && <p className="text-sm text-[var(--muted)]">{status}</p>}
      </Card>

      {!!items.length && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">Готово: {parsedCount}/{items.length}</p>
            <Button onClick={handleSave} disabled={saving || !parsedCount}>
              {saving ? "Сохраняем..." : `Сохранить ${parsedCount} трек(ов)`}
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <Card key={item.id} className="p-4 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-[var(--muted)]">Файл #{idx + 1}</p>
                    <p className="text-base font-semibold text-[var(--fg)]">{item.fileName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.loading && <span className="text-xs text-[var(--muted)]">Чтение метаданных…</span>}
                    {item.error && <span className="text-xs text-red-400">{item.error}</span>}
                    <Button variant="ghost" onClick={() => removeItem(item.id)}>Удалить</Button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm text-[var(--fg)]/80">
                    <span>Название</span>
                    <Input
                      value={item.data.title}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      placeholder="Название"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-[var(--fg)]/80">
                    <span>Исполнитель</span>
                    <Input
                      value={item.data.artist}
                      onChange={(e) => updateItem(item.id, { artist: e.target.value })}
                      placeholder="Исполнитель"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-[var(--fg)]/80">
                    <span>Альбом</span>
                    <Input
                      value={item.data.album || ""}
                      onChange={(e) => updateItem(item.id, { album: e.target.value })}
                      placeholder="Альбом"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-[var(--fg)]/80">
                    <span>Жанр</span>
                    <Input
                      value={item.data.genre || ""}
                      onChange={(e) => updateItem(item.id, { genre: e.target.value })}
                      list="genre-options"
                      placeholder="Жанр"
                    />
                    <datalist id="genre-options">
                      {genreOptions.map((opt) => <option key={opt} value={opt} />)}
                    </datalist>
                  </label>
                  <label className="space-y-1 text-sm text-[var(--fg)]/80">
                    <span>Год</span>
                    <Input
                      value={item.data.year || ""}
                      onChange={(e) => updateItem(item.id, { year: e.target.value })}
                      placeholder="Год"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-[var(--fg)]/80">
                    <span>Стиль</span>
                    <Input
                      value={item.data.style || ""}
                      onChange={(e) => updateItem(item.id, { style: e.target.value })}
                      list="style-options"
                      placeholder="Стиль"
                    />
                    <datalist id="style-options">
                      {styleOptions.map((opt) => <option key={opt} value={opt} />)}
                    </datalist>
                  </label>
                  <label className="space-y-1 text-sm text-[var(--fg)]/80">
                    <span>Настроение</span>
                    <Input
                      value={item.data.mood || ""}
                      onChange={(e) => updateItem(item.id, { mood: e.target.value })}
                      list="mood-options"
                      placeholder="Настроение"
                    />
                    <datalist id="mood-options">
                      {moodOptions.map((opt) => <option key={opt} value={opt} />)}
                    </datalist>
                  </label>
                  <label className="space-y-1 text-sm text-[var(--fg)]/80">
                    <span>Повод</span>
                    <Input
                      value={item.data.occasion || ""}
                      onChange={(e) => updateItem(item.id, { occasion: e.target.value })}
                      list="occasion-options"
                      placeholder="Повод"
                    />
                    <datalist id="occasion-options">
                      {occasionOptions.map((opt) => <option key={opt} value={opt} />)}
                    </datalist>
                  </label>
                </div>
                <div className="grid md:grid-cols-[1fr_1fr] gap-3">
                  <label className="space-y-1 text-sm text-[var(--fg)]/80">
                    <span>Обложка</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const coverUrl = await readAsDataUrl(file, file.type || undefined);
                        updateItem(item.id, { coverUrl, coverSource: "uploaded" });
                      }}
                      className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]"
                    />
                  </label>
                  {item.data.coverUrl ? (
                    <img src={item.data.coverUrl} alt="cover" className="h-28 w-28 object-cover rounded-xl" />
                  ) : (
                    <div className="h-28 w-28 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-xs text-[var(--muted)]">
                      Нет обложки
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
