"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Input } from "@one-app/ui";
import Link from "next/link";
import { adminApi } from "@/lib/api";

type Track = {
  apiId: string;
  uiId: string;
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  style?: string;
  genre?: string;
  occasion?: string;
  status: "draft" | "published";
};

export default function TracksAdminPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIds, setEditingIds] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<Track>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmTracks, setConfirmTracks] = useState<Track[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterArtist, setFilterArtist] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [filterOccasion, setFilterOccasion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<keyof Track | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [error, setError] = useState<string | null>(null);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listTracks();
      const normalized = (data as any[])
        .map((t, idx) => {
          const apiId = t._id ?? t.id;
          if (!apiId) return null;
          const publicId = t.id ?? t._id ?? apiId;
          const uiId = `${String(apiId)}__${idx}`;
          return { ...t, apiId: String(apiId), id: String(publicId), uiId };
        })
        .filter(Boolean) as Track[];
      if (!normalized.length) {
        console.warn("Tracks loaded but no id/_id present; skipping items");
      }
      setTracks(normalized as Track[]);
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить треки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const setField = (uiId: string, patch: Partial<Track>) => {
    setEdits((prev) => ({ ...prev, [uiId]: { ...prev[uiId], ...patch } }));
  };

  const currentValue = (t: Track, key: keyof Track) => (edits[t.uiId]?.[key] as any) ?? (t as any)[key] ?? "";
  const displayValue = (t: Track, key: keyof Track, editing: boolean) =>
    editing ? currentValue(t, key) : ((t as any)[key] ?? "");

  const allIds = useMemo(() => tracks.map((t) => t.uiId).filter(Boolean) as string[], [tracks]);
  const selectedCount = useMemo(() => selectedIds.length, [selectedIds]);
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;
  const filteredTracks = useMemo(() => {
    const norm = (v: string | undefined | null) => (v || "").toLowerCase();
    const title = norm(filterTitle);
    const artist = norm(filterArtist);
    const style = norm(filterStyle);
    const occasion = norm(filterOccasion);
    const status = norm(filterStatus);
    const matches = tracks.filter((t) => {
      if (title && !norm(t.title).includes(title)) return false;
      if (artist && !norm(t.artist).includes(artist)) return false;
      if (style && !norm(t.style || t.genre).includes(style)) return false;
      if (occasion && !norm(t.occasion).includes(occasion)) return false;
      if (status && norm(t.status) !== status) return false;
      return true;
    });
    if (!sortBy) return matches;
    return [...matches].sort((a, b) => {
      const av = (a as any)[sortBy] ?? "";
      const bv = (b as any)[sortBy] ?? "";
      return sortDir === "asc" ? String(av).localeCompare(String(bv), "ru") : String(bv).localeCompare(String(av), "ru");
    });
  }, [tracks, filterTitle, filterArtist, filterStyle, filterOccasion, filterStatus, sortBy, sortDir]);

  const toggleSelect = (uiId: string, checked: boolean) => {
    if (!uiId) return;
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(uiId) ? prev : [...prev, uiId];
      }
      return prev.filter((x) => x !== uiId);
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? allIds : []);
  };

  const setEditing = (ids: string[]) => {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    setEditingIds(unique);
  };

  const addEditing = (uiId: string) =>
    setEditingIds((prev) => (prev.includes(uiId) ? prev : [...prev, uiId]));

  const removeEditing = (uiId: string) =>
    setEditingIds((prev) => prev.filter((x) => x !== uiId));

  useEffect(() => {
    // сбрасываем выбор для треков, которых больше нет в списке
    setSelectedIds((prev) => prev.filter((id) => allIds.includes(id)));
    setEditingIds((prev) => prev.filter((id) => allIds.includes(id)));
  }, [allIds]);

  const toggleSort = (key: keyof Track) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("asc");
      return key;
    });
  };

  const updateTrackSafe = async (track: Track, body: any) => {
    const candidates = [track.apiId, track.id].filter(Boolean) as string[];
    if (!candidates.length) throw new Error("Нет идентификатора трека");
    let lastError: any = null;
    for (const id of candidates) {
      try {
        await adminApi.updateTrack(id, body);
        return;
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
  };

  const deleteTrackSafe = async (track: Track) => {
    const candidates = [track.apiId, track.id].filter(Boolean) as string[];
    if (!candidates.length) throw new Error("Нет идентификатора трека");
    let lastError: any = null;
    for (const id of candidates) {
      try {
        await adminApi.deleteTrack(id);
        return;
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
  };

  const buildPayload = (track: Track, extra?: Partial<Track>) => {
    const base = {
      title: currentValue(track, "title"),
      artist: currentValue(track, "artist"),
      style: currentValue(track, "style"),
      genre: currentValue(track, "genre"),
      occasion: currentValue(track, "occasion"),
      status: extra?.status ?? track.status
    };
    const withMedia: Record<string, any> = {
      ...base,
      audioUrl: (track as any).audioUrl,
      coverUrl: track.coverUrl,
      coverSource: (track as any).coverSource,
      mood: (track as any).mood,
      album: (track as any).album,
      year: (track as any).year,
      clientRequest: (track as any).clientRequest,
      creationStory: (track as any).creationStory
    };
    Object.keys(withMedia).forEach((k) => {
      if (withMedia[k] === undefined) delete withMedia[k];
    });
    return withMedia;
  };

  const handleSave = async (track: Track) => {
    setSavingId(track.uiId);
    setError(null);
    try {
      const payload = buildPayload(track);
      await updateTrackSafe(track, payload);
      await loadTracks();
      setEdits((prev) => {
        const next = { ...prev };
        delete next[track.uiId];
        return next;
      });
      removeEditing(track.uiId);
    } catch (e: any) {
      setError(e?.message || "Не удалось сохранить");
    } finally {
      setSavingId(null);
    }
  };

  const handlePublish = async (track: Track) => {
    setSavingId(track.uiId);
    setError(null);
    try {
      await updateTrackSafe(track, { status: "published" });
      await loadTracks();
    } catch (e: any) {
      setError(e?.message || "Не удалось опубликовать");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (track: Track) => {
    setDeletingId(track.uiId);
    setError(null);
    try {
      await deleteTrackSafe(track);
      await loadTracks();
      setConfirmTracks(null);
      setSelectedIds((prev) => prev.filter((x) => x !== track.uiId));
    } catch (e: any) {
      setError(e?.message || "Не удалось удалить трек");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteBulk = async (items: Track[]) => {
    setBulkDeleting(true);
    setError(null);
    try {
      await Promise.all(items.map((t) => deleteTrackSafe(t)));
      await loadTracks();
      setSelectedIds([]);
      setEditingIds([]);
      setConfirmTracks(null);
    } catch (e: any) {
      setError(e?.message || "Не удалось удалить выбранные треки");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handlePublishBulk = async (items: Track[]) => {
    setBulkDeleting(true);
    setError(null);
    try {
      await Promise.all(items.map((t) => updateTrackSafe(t, { status: "published" })));
      await loadTracks();
      setSelectedIds([]);
      setEditingIds([]);
    } catch (e: any) {
      setError(e?.message || "Не удалось опубликовать выбранные треки");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleUnpublishBulk = async (items: Track[]) => {
    setBulkDeleting(true);
    setError(null);
    try {
      await Promise.all(items.map((t) => updateTrackSafe(t, { status: "draft" })));
      await loadTracks();
      setSelectedIds([]);
      setEditingIds([]);
    } catch (e: any) {
      setError(e?.message || "Не удалось снять с публикации выбранные треки");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Каталог треков</p>
          <h1 className="text-2xl font-semibold">Треки</h1>
        </div>
        <div className="flex gap-2 items-center">
          <select
            disabled={!selectedCount}
            onChange={(e) => {
              const action = e.target.value;
              e.target.value = "";
              const items = tracks.filter((t) => selectedIds.includes(t.uiId));
              if (!items.length) return;
              if (action === "publish") {
                handlePublishBulk(items);
              } else if (action === "unpublish") {
                handleUnpublishBulk(items);
              } else if (action === "edit") {
                setEditing(items.map((t) => t.uiId));
              } else if (action === "delete") {
                setConfirmTracks(items);
              }
            }}
            className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white disabled:opacity-50"
            defaultValue=""
            aria-label="Действия с выбранными"
          >
            <option value="" disabled>
              Действия
            </option>
            <option value="publish">Опубликовать</option>
            <option value="unpublish">Снять с публикации</option>
            <option value="edit">Редактировать</option>
            <option value="delete">Удалить</option>
          </select>
          <Button as="a" href="/tracks/mass-upload">Массовая загрузка</Button>
          <Button as="a" href="/tracks/bulk" variant="ghost">JSON Bulk</Button>
          <Button as="a" href="/tracks/new">Загрузить трек</Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-[var(--muted)]">Загружаем треки…</p>}

      <Card>
        <div className="grid grid-cols-5 md:grid-cols-7 gap-2 text-sm text-white/60 mb-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleSelectAll(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
              aria-label="Выбрать все треки"
            />
            <Input
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
              placeholder="Фильтр по названию"
              className="h-8 text-xs"
            />
          </div>
          <Input
            value={filterArtist}
            onChange={(e) => setFilterArtist(e.target.value)}
            placeholder="Исполнитель"
            className="h-8 text-xs"
          />
          <Input
            value={filterStyle}
            onChange={(e) => setFilterStyle(e.target.value)}
            placeholder="Стиль"
            className="h-8 text-xs"
          />
          <Input
            value={filterOccasion}
            onChange={(e) => setFilterOccasion(e.target.value)}
            placeholder="Повод"
            className="h-8 text-xs"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-lg bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-2 text-xs text-[var(--fg)]"
          >
            <option value="">Все статусы</option>
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
          </select>
          <span className="hidden md:block" />
          <span className="hidden md:block" />
        </div>

        <div className="grid grid-cols-[52px,72px,1.8fr,1.2fr,1.1fr,0.8fr,1fr] text-sm text-white/60 mb-2">
          <button type="button" className="text-left" onClick={() => toggleSort("id")}>
            #
          </button>
          <span>Обложка</span>
          <button type="button" className="text-left" onClick={() => toggleSort("title")}>
            Название {sortBy === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button type="button" className="text-left" onClick={() => toggleSort("style")}>
            Стиль / Повод {sortBy === "style" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button type="button" className="text-left" onClick={() => toggleSort("artist")}>
            Исполнитель {sortBy === "artist" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button type="button" className="text-left" onClick={() => toggleSort("status")}>
            Статус {sortBy === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <span>Действия</span>
        </div>
        <div className="divide-y divide-white/10">
          {filteredTracks.map((t: Track, idx) => {
            const editing = editingIds.includes(t.uiId);
            return (
              <div key={`${t.uiId}-${idx}`} className="grid grid-cols-[52px,72px,1.8fr,1.2fr,1.1fr,0.8fr,1fr] py-2 items-center gap-2 hover:bg-white/5 transition rounded-md px-2 -mx-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--accent)]"
                  checked={selectedIds.includes(t.uiId)}
                  onChange={(e) => toggleSelect(t.uiId, e.target.checked)}
                  aria-label={`Выбрать трек ${t.title}`}
                />
                {t.coverUrl ? (
                  <img src={t.coverUrl} alt="cover" className="h-12 w-12 rounded-md object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-white/10" aria-label="Обложка" />
                )}
                <div className="flex flex-col gap-1">
                  {editing ? (
                    <Input
                      value={currentValue(t, "title")}
                      onChange={(e) => setField(t.uiId, { title: e.target.value })}
                      className="h-9"
                    />
                  ) : (
                    <button className="text-left font-medium text-white hover:text-[var(--accent)] transition" onClick={() => addEditing(t.uiId)}>
                      {t.title}
                    </button>
                  )}
                  <Link href={`/tracks/${t.id}`} className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition">
                    Открыть карточку
                  </Link>
                </div>
                {editing ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={currentValue(t, "style")}
                      onChange={(e) => setField(t.uiId, { style: e.target.value })}
                      placeholder="Стиль или жанр"
                      className="h-9"
                    />
                    <Input
                      value={currentValue(t, "occasion")}
                      onChange={(e) => setField(t.uiId, { occasion: e.target.value })}
                      placeholder="Повод"
                      className="h-9"
                    />
                  </div>
                ) : (
                  <span className="text-white/70 text-sm">{displayValue(t, "style", editing) || t.genre || "—"} • {t.occasion || "—"}</span>
                )}
                {editing ? (
                  <Input
                    value={currentValue(t, "artist")}
                    onChange={(e) => setField(t.uiId, { artist: e.target.value })}
                    placeholder="Исполнитель"
                    className="h-9"
                  />
                ) : (
                  <span className="text-white/70">{displayValue(t, "artist", editing)}</span>
                )}
                <span className="text-xs uppercase tracking-wide text-white/70">{displayValue(t, "status", editing)}</span>
                <div className="flex gap-2 flex-wrap">
                  {editing ? (
                    <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave(t)}
                        disabled={savingId === t.uiId}
                      >
                        {savingId === t.uiId ? "Сохраняем..." : "Сохранить"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          removeEditing(t.uiId);
                          setEdits((prev) => {
                            const next = { ...prev };
                            delete next[t.uiId];
                            return next;
                          });
                        }}
                        disabled={savingId === t.uiId}
                      >
                        Отменить
                      </Button>
                    </div>
                  ) : t.status === "draft" ? (
                    <Button onClick={() => handlePublish(t)} disabled={savingId === t.uiId}>
                      {savingId === t.uiId ? "Публикуем..." : "Опубликовать"}
                    </Button>
                  ) : null}
                  {!editing && (
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmTracks([t])}
                      disabled={deletingId === t.uiId}
                      className="text-red-300 hover:text-red-200 hover:bg-red-300/10"
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {!tracks.length && !loading && <p className="py-4 text-sm text-white/60">Треков пока нет.</p>}
        </div>
      </Card>

      {confirmTracks && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-[var(--card)] border border-[var(--border-strong)] shadow-[var(--shadow-card)] rounded-2xl p-6 max-w-md w-full space-y-4">
            <div>
              <p className="text-lg font-semibold text-white">Удалить {confirmTracks.length > 1 ? "треки" : "трек"}?</p>
              <div className="text-sm text-white/70 mt-1 space-y-1 max-h-32 overflow-y-auto">
                {confirmTracks.slice(0, 3).map((ct) => (
                  <p key={ct.id}>
                    {ct.title} — {ct.artist || "Без артиста"}
                  </p>
                ))}
                {confirmTracks.length > 3 && <p className="text-[var(--muted)]">и ещё {confirmTracks.length - 3}…</p>}
              </div>
            </div>
            <p className="text-sm text-[var(--muted)]">Действие необратимо. Треки исчезнут из каталога и плейлистов.</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmTracks(null)} disabled={deletingId !== null || bulkDeleting}>
                Отмена
              </Button>
              <Button
                variant="ghost"
                className="bg-red-500/10 text-red-200 hover:bg-red-500/20"
                disabled={bulkDeleting || deletingId !== null}
                onClick={() => (confirmTracks.length > 1 ? handleDeleteBulk(confirmTracks) : handleDelete(confirmTracks[0]))}
              >
                {bulkDeleting || deletingId ? "Удаляем..." : "Удалить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
