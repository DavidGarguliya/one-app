"use client";
import { useEffect, useState } from "react";
import { Card, Button, Input } from "@one-app/ui";
import { adminApi } from "@/lib/api";

type Item = { id: string; name: string };

export default function StylesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const load = async () => { const data = await adminApi.listStyles(); setItems(data); };
  useEffect(() => { load(); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminApi.createStyle({ name });
    setName("");
    load();
  };
  const remove = async (id: string) => { await adminApi.deleteStyle(id); load(); };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Справочник</p>
          <h1 className="text-2xl font-semibold">Стили</h1>
        </div>
      </div>
      <Card className="p-4 rounded-2xl space-y-3">
        <form className="flex gap-2" onSubmit={submit}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" required />
          <Button type="submit">Добавить</Button>
        </form>
      </Card>
      <Card>
        <div className="grid grid-cols-3 text-sm text-white/60 mb-2">
          <span>ID</span><span>Название</span><span>Действия</span>
        </div>
        <div className="divide-y divide-white/10">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-3 py-2 items-center">
              <span className="text-sm text-white/70">{item.id}</span>
              <span className="font-medium">{item.name}</span>
              <div className="flex gap-2">
                <Button variant="ghost" type="button" onClick={() => remove(item.id)}>Удалить</Button>
              </div>
            </div>
          ))}
          {!items.length && <p className="py-4 text-sm text-white/60">Пока пусто.</p>}
        </div>
      </Card>
    </div>
  );
}
