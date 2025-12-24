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

const uploadFile = async (file: Blob, fileName: string) => {
  const form = new FormData();
  form.append("file", file, fileName);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const res = await fetch(`${apiUrl}/v1/tracks/upload`, {
    method: "POST",
    body: form
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Не удалось загрузить файл");
  }
  const json = await res.json();
  return json.url as string;
};

const blobToDataUrl = (data: Uint8Array, type: string) =>
  new Promise<string>((resolve) => {
    const blob = new Blob([data], { type });
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

export default function TracksMassUploadPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dirInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<ParsedTrack[]>([]);
  const [parsing, setParsing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("published");
  const [styleOptions, setStyleOptions] = useState<string[]>([]);
  const [moodOptions, setMoodOptions] = useState<string[]>([]);
  const [occasionOptions, setOccasionOptions] = useState<string[]>([]);
  const [genreOptions, setGenreOptions] = useState<string[]>([]);

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
        const metadata = await parseBlob(file);
        const audioUrl = await uploadFile(file, file.name);
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
          <Button type="button" variant="secondary" onClick={() => dirInputRef.current?.click()}>
            Выбрать папку
          </Button>
          <span className="text-xs text-[var(--muted)]">
            Поддержка >50 файлов. Папки разворачиваются рекурсивно, скрытые файлы и каталоги (начинающиеся с «.») игнорируются.
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aiff,audio/x-aiff"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <input
          ref={dirInputRef}
          type="file"
          multiple
          accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aiff,audio/x-aiff"
          onChange={(e) => handleFiles(e.target.files)}
          // allow full directory pick in all browsers
          // @ts-expect-error non-standard attributes for directory selection
          webkitdirectory="true"
          // @ts-expect-error non-standard attributes for directory selection
          directory="true"
          // @ts-expect-error non-standard attributes for directory selection
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
                        const coverUrl = await readAsDataUrl(file);
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
