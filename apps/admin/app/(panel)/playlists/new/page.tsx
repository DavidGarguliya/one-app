"use client";
import { useState } from "react";
import { Card, Input, Button } from "@one-app/ui";

export default function PlaylistCreatePage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    setStatus(null);
    try {
      const payload = {
        title: data.get("title")?.toString() || "",
        description: data.get("description")?.toString() || "",
        coverUrl: data.get("coverUrl")?.toString() || "",
        trackIds: (data.get("trackIds")?.toString() || "").split(",").map((s) => s.trim()).filter(Boolean),
        status: data.get("status")?.toString() || "draft"
      };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/v1/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("Плейлист сохранён");
      form.reset();
    } catch (err: any) {
      setStatus(err?.message || "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Новый плейлист</h1>
      </div>
      <Card className="p-4 space-y-4 rounded-2xl">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input name="title" placeholder="Название" required />
          <Input name="description" placeholder="Описание" />
          <Input name="coverUrl" placeholder="Ссылка на обложку" />
          <Input name="trackIds" placeholder="ID треков через запятую" />
          <label className="text-sm text-white/80 space-y-1">
            <span>Статус</span>
            <select name="status" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <option value="draft">Черновик</option>
              <option value="published">Опубликован</option>
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Сохраняем..." : "Сохранить"}</Button>
            {status && <p className="text-sm text-white/70">{status}</p>}
          </div>
        </form>
      </Card>
    </div>
  );
}
