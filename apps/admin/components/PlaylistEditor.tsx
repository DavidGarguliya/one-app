"use client";

import { useMemo, useState } from "react";
import { Button, Card, Input } from "@one-app/ui";
import { adminApi } from "@/lib/api";

type Playlist = {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  trackIds: string[];
  status?: string;
};

export function PlaylistEditor({ initial }: { initial: Playlist }) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl ?? "");
  const [trackIds, setTrackIds] = useState((initial.trackIds || []).join(","));
  const [status, setStatus] = useState(initial.status ?? "draft");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const parsedTrackIds = useMemo(
    () =>
      trackIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [trackIds]
  );

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await adminApi.updatePlaylist(initial.id, {
        title,
        description,
        coverUrl,
        trackIds: parsedTrackIds,
        status
      });
      setMessage("Сохранено");
    } catch (e: any) {
      setMessage(e?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const clearCover = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await adminApi.updatePlaylist(initial.id, {
        coverUrl: "",
        trackIds: parsedTrackIds
      });
      setCoverUrl("");
      setMessage("Обложка сброшена");
    } catch (e: any) {
      setMessage(e?.message || "Не удалось сбросить обложку");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Удалить плейлист?")) return;
    setDeleting(true);
    setMessage(null);
    try {
      await adminApi.deletePlaylist(initial.id);
      setMessage("Удалено");
    } catch (e: any) {
      setMessage(e?.message || "Не удалось удалить");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="p-4 space-y-4 rounded-2xl">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" />
          <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="Ссылка на обложку (оставьте пустым для авто)" />
          <Input
            value={trackIds}
            onChange={(e) => setTrackIds(e.target.value)}
            placeholder="ID треков через запятую"
          />
          <label className="text-sm text-white/80 space-y-1">
            <span>Статус</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
            >
              <option value="draft">Черновик</option>
              <option value="published">Опубликован</option>
            </select>
          </label>
        </div>
        <div className="space-y-3">
          <div className="h-40 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
            {coverUrl ? (
              <img src={coverUrl} alt="cover" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm text-white/60 px-3 text-center">Обложка сгенерируется автоматически из треков</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || deleting}>
              {saving ? "Сохраняем..." : "Сохранить"}
            </Button>
            <Button variant="ghost" onClick={clearCover} disabled={saving || deleting}>
              Сбросить обложку
            </Button>
            <Button
              variant="ghost"
              className="text-red-300 hover:text-red-200 hover:bg-red-300/10"
              onClick={remove}
              disabled={deleting || saving}
            >
              {deleting ? "Удаляем..." : "Удалить"}
            </Button>
          </div>
          {message && <p className="text-sm text-white/70">{message}</p>}
        </div>
      </div>
    </Card>
  );
}
