import { adminApi } from "@/lib/api";
import { notFound } from "next/navigation";
import { PlaylistEditor } from "@/components/PlaylistEditor";

export default async function PlaylistDetail({ params }: { params: { id: string } }) {
  const playlists = await adminApi.listPlaylists();
  const playlist = playlists.find((p: any) => p.id === params.id);
  if (!playlist) return notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{playlist.title}</h1>
      <PlaylistEditor initial={playlist} />
    </div>
  );
}
