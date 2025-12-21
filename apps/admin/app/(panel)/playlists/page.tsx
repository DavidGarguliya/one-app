import { Button, Card } from "@one-app/ui";
import Link from "next/link";
import { adminApi } from "@/lib/api";

export default async function PlaylistsAdminPage() {
  const playlists = await adminApi.listPlaylists();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Сборники</p>
          <h1 className="text-2xl font-semibold">Плейлисты</h1>
        </div>
        <Button as="a" href="/playlists/new">Новый плейлист</Button>
      </div>
      <Card>
        <div className="grid grid-cols-5 text-sm text-white/60 mb-2">
          <span>Название</span>
          <span>Описание</span>
          <span>Треки</span>
          <span>Статус</span>
          <span>Действия</span>
        </div>
        <div className="divide-y divide-white/10">
          {playlists.map((pl: any) => (
            <div key={pl.id} className="grid grid-cols-5 py-2 items-center gap-2">
              <span className="font-medium text-white">{pl.title}</span>
              <span className="text-white/70 text-sm line-clamp-2">{pl.description || "—"}</span>
              <span className="text-white/60 text-sm">{pl.trackIds?.length || 0} треков</span>
              <span className="text-white/70 text-xs uppercase">{pl.status}</span>
              <div className="flex gap-2">
                <Link href={`/playlists/${pl.id}`} className="text-sm text-[var(--accent)]">Открыть</Link>
              </div>
            </div>
          ))}
          {!playlists.length && <p className="py-4 text-sm text-white/60">Плейлистов пока нет.</p>}
        </div>
      </Card>
    </div>
  );
}
