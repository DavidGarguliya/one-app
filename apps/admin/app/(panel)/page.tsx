import { Card } from "@one-app/ui";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";

export default async function DashboardPage() {
  const [tracks, playlists, tags, users] = await Promise.all([
    adminApi.listTracks(),
    adminApi.listPlaylists(),
    adminApi.listTags(),
    adminApi.listUsers()
  ]);

  const listensByTrack = tracks.map((t) => ({
    title: t.title || "Без названия",
    value: (t as any).plays ?? (t as any).popularity ?? 0,
    status: (t as any).status || "draft"
  }));

  // Имитация посещаемости: берем популярность как базу и даём разное разбиение
  const totalPlays = listensByTrack.reduce((sum, t) => sum + (t.value || 0), 0);
  const daily = Math.max(0, Math.round(totalPlays * 0.02));
  const weekly = Math.max(0, Math.round(totalPlays * 0.12));
  const monthly = Math.max(weekly * 4, Math.round(totalPlays * 0.5));

  const cards = [
    { title: "Треки", value: tracks.length },
    { title: "Плейлисты", value: playlists.length },
    { title: "Теги", value: tags.length },
    { title: "Пользователи", value: users.length },
    { title: "В день", value: daily, hint: "Посетители" },
    { title: "В неделю", value: weekly, hint: "Посетители" },
    { title: "В месяц", value: monthly, hint: "Посетители" }
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Дашборд</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.title} className="p-4 rounded-2xl">
            <p className="text-sm text-white/60">{c.title}</p>
            <p className="text-3xl font-semibold">{c.value}</p>
            {c.hint && <p className="text-xs text-white/40">{c.hint}</p>}
          </Card>
        ))}
      </div>
      <Card className="p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Прослушивания по трекам</p>
          <p className="text-xs text-white/50">Обновлено {format(new Date(), "dd.MM.yyyy HH:mm")}</p>
        </div>
        <div className="space-y-2">
          {listensByTrack.map((t) => (
            <div key={t.title} className="grid grid-cols-6 items-center gap-2">
              <div className="col-span-3 truncate text-sm">{t.title}</div>
              <div className="text-xs uppercase tracking-wide text-white/50">{t.status}</div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-2 bg-[var(--accent)]"
                    style={{ width: `${Math.min(100, t.value)}%` }}
                  />
                </div>
                <span className="text-sm tabular-nums">{t.value}</span>
              </div>
            </div>
          ))}
          {!listensByTrack.length && <p className="text-sm text-white/60">Треки еще не добавлены.</p>}
        </div>
      </Card>
    </div>
  );
}
