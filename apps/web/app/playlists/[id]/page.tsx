import { notFound } from "next/navigation";
import { fetchPlaylist, fetchTracks, fetchPlaylists } from "../../../lib/api";
import PlaylistView from "../../../components/PlaylistView";

export default async function PlaylistPage({ params }: { params: { id: string } }) {
  const playlist = await fetchPlaylist(params.id);
  if (!playlist) return notFound();
  const allTracks = await fetchTracks({ slim: true });
  const tracks = playlist.trackIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter(Boolean) as any[];
  return <PlaylistView playlist={playlist} tracks={tracks} />;
}
