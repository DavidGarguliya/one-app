import { adminApi } from "@/lib/api";
import { notFound } from "next/navigation";
import { Card } from "@one-app/ui";

export default async function PlaylistDetail({ params }: { params: { id: string } }) {
  const playlists = await adminApi.listPlaylists();
  const playlist = playlists.find((p: any) => p.id === params.id);
  if (!playlist) return notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{playlist.title}</h1>
      <Card className="space-y-2 p-4 rounded-2xl">
        <p className="text-white/70">Описание: {playlist.description || "—"}</p>
        <p className="text-white/70">Статус: {playlist.status}</p>
        <p className="text-white/70">Треков: {playlist.trackIds?.length || 0}</p>
      </Card>
    </div>
  );
}
