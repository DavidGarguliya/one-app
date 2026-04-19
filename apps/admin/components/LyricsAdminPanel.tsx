"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import { Card, Button } from "@one-app/ui";
import { LyricsJob, LyricsPayload } from "@one-app/types";

type Props = {
  trackId: string;
};

export function LyricsAdminPanel({ trackId }: Props) {
  const [job, setJob] = useState<LyricsJob | null>(null);
  const [payload, setPayload] = useState<LyricsPayload | null>(null);
  const [language, setLanguage] = useState("auto");
  const [separateVocals, setSeparateVocals] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = useMemo(() => {
    if (!job) return "Не запущено";
    if (job.status === "queued") return "В очереди";
    if (job.status === "processing") return "Обработка";
    if (job.status === "done") return "Готово";
    return `Ошибка: ${job.errorMessage || "неизвестно"}`;
  }, [job]);

  const hasResult = job?.status === "done" && payload?.words?.length;
  const downloadHref = job?.status === "done" ? adminApi.lyricsDownloadUrl(trackId) : undefined;

  const fetchStatus = async () => {
    try {
      const res = await adminApi.lyricsStatus(trackId);
      setJob(res);
      if (res?.status === "done") {
        const result = await adminApi.lyricsResult(trackId).catch(() => null);
        if (result?.payload) setPayload(result.payload);
      }
    } catch (e: any) {
      setError(e?.message || "Не удалось получить статус");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (job?.status === "done" || job?.status === "error") return;
      fetchStatus();
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.requestLyrics(trackId, {
        language: language === "auto" ? undefined : language,
        separateVocals
      });
      setJob(res);
    } catch (e: any) {
      setError(e?.message || "Не удалось поставить задачу");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!payload) return;
    const lines: string[] = [];
    let line: string[] = [];
    let prev = 0;
    payload.words.forEach((w) => {
      const gap = w.start - prev;
      if ((gap > 2.5 || line.length >= 8) && line.length) {
        lines.push(line.join(" "));
        line = [];
      }
      line.push(w.word);
      prev = w.end ?? w.start;
    });
    if (line.length) lines.push(line.join(" "));
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setError(null);
    } catch {
      setError("Не удалось скопировать");
    }
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lyrics Engine</p>
          <h3 className="text-lg font-semibold">Текст и таймкоды</h3>
          <p className="text-sm text-muted-foreground">
            {statusLabel}
            {job?.provider ? ` · ${job.provider}` : ""} {job?.language ? `· ${job.language}` : ""}
          </p>
        </div>
        <Button variant="primary" onClick={handleGenerate} disabled={loading}>
          {loading ? "Генерируем…" : job?.status === "done" ? "Перегенерировать" : "Generate"}
        </Button>
      </div>

      <div className="flex gap-3 items-center text-sm flex-wrap">
        <label className="flex items-center gap-2">
          Язык:
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-28 rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-[var(--focus-ring)]"
          >
            <option value="auto">auto</option>
            <option value="ru">ru</option>
            <option value="en">en</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={separateVocals}
            onChange={(e) => setSeparateVocals(e.target.checked)}
            className="h-4 w-4"
          />
          Вокал отдельно
        </label>
        {job?.updatedAt && <span className="text-muted-foreground text-sm">Обновлено: {new Date(job.updatedAt).toLocaleTimeString()}</span>}
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="border rounded-md p-3 bg-background/50">
        {hasResult ? (
          <div className="space-y-1 max-h-60 overflow-auto">
            {(() => {
              const lines: { text: string; active: boolean }[] = [];
              let current: string[] = [];
              let prev = 0;
              payload?.words.forEach((w) => {
                const gap = w.start - prev;
                if ((gap > 2.5 || current.length >= 8) && current.length) {
                  lines.push({ text: current.join(" "), active: false });
                  current = [];
                }
                current.push(w.word);
                prev = w.end ?? w.start;
              });
              if (current.length) lines.push({ text: current.join(" "), active: false });
              return lines.map((l, idx) => (
                <div key={idx} className="text-sm">
                  {l.text}
                </div>
              ));
            })()}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Текст пока не сгенерирован.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button as="a" href={downloadHref} variant="ghost" disabled={!hasResult}>
          Скачать .lrc
        </Button>
        <Button onClick={handleCopy} variant="ghost" disabled={!hasResult}>
          Скопировать текст
        </Button>
      </div>
    </Card>
  );
}
