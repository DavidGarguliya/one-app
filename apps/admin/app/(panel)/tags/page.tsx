"use client";
import { useEffect, useState } from "react";
import { Card, Button, Input } from "@one-app/ui";
import { adminApi } from "@/lib/api";

export default function TagsAdminPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", type: "genre" });
  const load = async () => {
    const data = await adminApi.listTags();
    setTags(data);
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.createTag(form);
      setForm({ name: "", slug: "", type: "genre" });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Теги</p>
          <h1 className="text-2xl font-semibold">Теги</h1>
        </div>
      </div>
      <Card className="p-4 rounded-2xl space-y-3">
        <form className="grid md:grid-cols-4 gap-3" onSubmit={submit}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" required />
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Слаг" required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm">
            <option value="genre">Жанр</option>
            <option value="style">Стиль</option>
            <option value="mood">Настроение</option>
            <option value="occasion">Повод</option>
          </select>
          <Button type="submit" disabled={loading}>{loading ? "Сохраняем..." : "Добавить"}</Button>
        </form>
      </Card>
      <Card>
        <div className="grid grid-cols-4 text-sm text-white/60 mb-2">
          <span>ID</span>
          <span>Название</span>
          <span>Тип</span>
          <span>Слаг</span>
        </div>
        <div className="divide-y divide-white/10">
          {tags.map((tag) => (
            <div key={tag.id} className="grid grid-cols-4 py-2 items-center">
              <span className="text-sm text-white/70">{tag.id}</span>
              <span className="font-medium">{tag.name}</span>
              <span className="text-sm text-white/60">{tag.type}</span>
              <span className="text-sm text-white/60">{tag.slug}</span>
            </div>
          ))}
          {!tags.length && <p className="py-4 text-sm text-white/60">Тегов пока нет.</p>}
        </div>
      </Card>
    </div>
  );
}
