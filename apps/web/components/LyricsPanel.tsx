"use client";

import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { usePlayerStore } from "@one-app/player";
import { LyricsPayload } from "@one-app/types";
import { fetchLyricsResult, fetchLyricsStatus, lyricsDownloadUrl, lyricsUiEnabled, requestLyricsGeneration } from "@/lib/lyrics";
import { LyricsViewer } from "./LyricsViewer";

const formatPlainText = (payload?: LyricsPayload) => {
  if (!payload?.words?.length) return "";
  const lines: string[] = [];
  let current: string[] = [];
  let prevEnd = 0;
  payload.words.forEach((w) => {
    const gap = w.start - prevEnd;
    if ((gap > 2.5 || current.length >= 8) && current.length) {
      lines.push(current.join(" "));
      current = [];
    }
    current.push(w.word);
    prevEnd = w.end ?? w.start;
  });
  if (current.length) lines.push(current.join(" "));
  return lines.join("\n");
};

export function LyricsPanel({ trackId, trackTitle }: { trackId: string; trackTitle?: string }) {
  const isCurrentTrack = usePlayerStore((s) => s.currentTrack?.id === trackId);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const [error, setError] = useState<string | null>(null);
  const [separateVocals, setSeparateVocals] = useState(false);
  const [language, setLanguage] = useState("auto");

  const statusQuery = useQuery({
    queryKey: ["lyrics-status", trackId],
    queryFn: () => fetchLyricsStatus(trackId),
    enabled: lyricsUiEnabled && !!trackId,
    refetchInterval: (data) => (data?.status === "queued" || data?.status === "processing" ? 2500 : false),
    retry: false
  });

  const resultQuery = useQuery({
    queryKey: ["lyrics-result", trackId],
    queryFn: () => fetchLyricsResult(trackId),
    enabled: !!statusQuery.data && statusQuery.data.status === "done",
    retry: false
  });

  useEffect(() => {
    if (statusQuery.data?.status === "done") {
      resultQuery.refetch();
    }
  }, [statusQuery.data?.status, resultQuery]);

  if (!lyricsUiEnabled) return null;

  const status = statusQuery.data?.status;
  const payload = resultQuery.data?.payload;
  const busy = status === "queued" || status === "processing";
  const hasResult = status === "done" && !!payload;
  const downloadHref = lyricsDownloadUrl(trackId);
  const statusLabel =
    status === "queued" ? "В очереди" : status === "processing" ? "Обрабатываем" : status === "done" ? "Готово" : "Не запущено";

  const handleGenerate = async () => {
    setError(null);
    const job = await requestLyricsGeneration(trackId, {
      language: language === "auto" ? undefined : language,
      separateVocals
    });
    if (!job) {
      setError("Не удалось поставить задачу. Проверьте доступность сервиса.");
      return;
    }
    statusQuery.refetch();
  };

  const handleCopy = async () => {
    if (!payload) return;
    const text = formatPlainText(payload);
    try {
      await navigator.clipboard.writeText(text);
      setError(null);
    } catch {
      setError("Не удалось скопировать текст.");
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Lyrics Engine</p>
          <h3 className="text-lg font-semibold">Текст и таймкоды</h3>
          <p className="text-sm text-[var(--muted)]">
            {statusLabel} {statusQuery.data?.provider ? `· ${statusQuery.data.provider}` : ""} {statusQuery.data?.language ? `· ${statusQuery.data.language}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy}
            className="px-4 py-2 rounded-full bg-[var(--accent)] text-[#0a0d14] text-sm font-semibold shadow-[var(--shadow)] disabled:opacity-60"
          >
            {busy ? "Генерируем…" : status === "done" ? "Пересоздать" : "Generate Lyrics"}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        <label className="flex items-center gap-2">
          <span>Язык:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm text-[var(--fg)]"
          >
            <option value="auto">Auto</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={separateVocals}
            onChange={(e) => setSeparateVocals(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)] rounded"
          />
          <span>Вокал отдельно</span>
        </label>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
          <span className="text-[var(--muted)]">Status: {statusLabel}</span>
        </span>
        {statusQuery.data?.updatedAt && <span className="text-[var(--muted)]">Обновлено: {new Date(statusQuery.data.updatedAt).toLocaleTimeString()}</span>}
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <LyricsViewer payload={payload} currentTime={isCurrentTrack ? currentTime : 0} loading={busy && !hasResult} />

      <div className="flex flex-wrap gap-3">
        <a
          className={`px-3 py-2 rounded-lg text-sm border border-[var(--border)] ${hasResult ? "bg-[var(--glass)] hover:border-[var(--accent)]" : "opacity-60 pointer-events-none"}`}
          href={hasResult ? downloadHref : undefined}
          download={`${trackTitle || trackId}.lrc`}
        >
          Скачать .lrc
        </a>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasResult}
          className="px-3 py-2 rounded-lg text-sm border border-[var(--border)] bg-[color-mix(in_srgb,var(--glass)_90%,transparent)] hover:border-[var(--accent)] disabled:opacity-60"
        >
          Скопировать текст
        </button>
      </div>
    </section>
  );
}
