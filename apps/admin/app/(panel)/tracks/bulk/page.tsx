"use client";

import { useState } from "react";
import { adminApi } from "@/lib/api";
import { Button, Card, Input } from "@one-app/ui";

const sample = `[
  {
    "title": "Название трека",
    "artist": "Исполнитель",
    "audioUrl": "https://example.com/audio.mp3",
    "coverUrl": "https://example.com/cover.jpg",
    "style": "Поп",
    "mood": "Радость",
    "occasion": "День рождения",
    "status": "published"
  }
]`;

export default function TracksBulkPage() {
  const [payload, setPayload] = useState(sample);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const parsed = JSON.parse(payload);
      if (!Array.isArray(parsed)) {
        throw new Error("Ожидается массив объектов треков");
      }
      await adminApi.createTracksBulk(parsed);
      setStatus(`Загружено: ${parsed.length}`);
    } catch (err: any) {
      setStatus(err?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--fg)]">Bulk загрузка треков</h1>
        <p className="text-sm text-[var(--muted)]">
          Вставьте массив треков в формате JSON. Поля: title, artist, audioUrl, coverUrl, style, mood, occasion, status.
        </p>
      </div>
      <Card className="space-y-3">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm text-[var(--fg)]/80">
            <span>JSON</span>
            <textarea
              className="w-full rounded-2xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)] h-64"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? "Загружаем..." : "Загрузить"}
          </Button>
          {status && <p className="text-sm text-[var(--muted)]">{status}</p>}
        </form>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-[var(--fg)]">Подсказки</h3>
        <ul className="text-sm text-[var(--muted)] list-disc pl-5 space-y-1 mt-2">
          <li>status: draft или published</li>
          <li>Можно указывать genre, story, clientRequest, creationStory, popularity</li>
          <li>Обязательно: title, artist, audioUrl, coverUrl</li>
        </ul>
      </Card>
    </main>
  );
}
