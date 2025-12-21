"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input } from "@one-app/ui";
import { adminApi } from "@/lib/api";

export default function GenresPage() {
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listTags();
      const filtered = Array.isArray(data) ? data.filter((t) => t.type === "genre") : [];
      setGenres(filtered);
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить жанры");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.createTag({ name: form.name, slug: form.slug, type: "genre" });
      setForm({ name: "", slug: "" });
      await load();
    } catch (e: any) {
      setError(e?.message || "Не удалось сохранить жанр");
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, patch: any) => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.updateTag(id, patch);
      await load();
    } catch (e: any) {
      setError(e?.message || "Не удалось обновить жанр");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.deleteTag(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Не удалось удалить жанр");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Жанры</p>
          <h1 className="text-2xl font-semibold">Жанры</h1>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-[var(--muted)]">Загружаем жанры…</p>}

      <Card className="p-4 rounded-2xl space-y-3">
        <h2 className="text-lg font-semibold">Добавить жанр</h2>
        <div className="grid md:grid-cols-3 gap-2">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Название"
          />
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="Слаг"
          />
          <Button onClick={save} disabled={saving || !form.name.trim() || !form.slug.trim()}>
            {saving ? "Сохраняем..." : "Сохранить"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-[1.4fr,1.4fr,0.9fr,1.1fr] text-sm text-white/60 mb-2">
          <span>ID</span>
          <span>Название</span>
          <span>Слаг</span>
          <span>Действия</span>
        </div>
        <div className="divide-y divide-white/10">
          {genres.map((g) => (
            <div key={g.id} className="grid grid-cols-[1.4fr,1.4fr,0.9fr,1.1fr] py-2 items-center gap-2">
              <span className="text-sm text-white/70 truncate">{g.id}</span>
              {editingId === g.id ? (
                <Input
                  value={g.name}
                  onChange={(e) => setGenres((prev) => prev.map((it) => (it.id === g.id ? { ...it, name: e.target.value } : it)))}
                />
              ) : (
                <span className="font-medium">{g.name}</span>
              )}
              {editingId === g.id ? (
                <Input
                  value={g.slug}
                  onChange={(e) => setGenres((prev) => prev.map((it) => (it.id === g.id ? { ...it, slug: e.target.value } : it)))}
                />
              ) : (
                <span className="text-sm text-white/60">{g.slug}</span>
              )}
              <div className="flex gap-2">
                {editingId === g.id ? (
                  <>
                    <Button
                      onClick={() => {
                        update(g.id, { name: g.name, slug: g.slug });
                        setEditingId(null);
                      }}
                      disabled={saving}
                    >
                      Сохранить
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>Отмена</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => setEditingId(g.id)}>Редактировать</Button>
                    <Button
                      variant="ghost"
                      className="text-red-300 hover:text-red-200 hover:bg-red-300/10"
                      onClick={() => remove(g.id)}
                      disabled={saving}
                    >
                      Удалить
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {!genres.length && !loading && <p className="py-4 text-sm text-white/60">Жанров пока нет.</p>}
        </div>
      </Card>
    </div>
  );
}
