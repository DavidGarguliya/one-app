import { Card } from "@one-app/ui";
import { adminApi } from "@/lib/api";

export default async function DashboardPage() {
  const [tracks, playlists, tags, users] = await Promise.all([
    adminApi.listTracks(),
    adminApi.listPlaylists(),
    adminApi.listTags(),
    adminApi.listUsers()
  ]);
  const cards = [
    { title: "Треки", value: tracks.length },
    { title: "Плейлисты", value: playlists.length },
    { title: "Теги", value: tags.length },
    { title: "Пользователи", value: users.length }
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Дашборд</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.title} className="p-4 rounded-2xl">
            <p className="text-sm text-white/60">{c.title}</p>
            <p className="text-3xl font-semibold">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
