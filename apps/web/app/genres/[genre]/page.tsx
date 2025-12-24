import Link from "next/link";
import { fetchTracks } from "../../../lib/api";
import PlaylistView from "../../../components/PlaylistView";

type Props = {
  params: { genre: string };
};

const normalize = (value: string) => value.toLowerCase().trim();

export default async function GenrePage({ params }: Props) {
  const genreParam = decodeURIComponent(params.genre || "");
  const genreKey = normalize(genreParam);
  const data = await fetchTracks().catch(() => []);
  const tracks = data.filter((t) => normalize(t.genre || "") === genreKey);
  const playlistLike = {
    id: `genre-${genreKey}`,
    title: genreParam || "Жанр",
    description: `Треки в жанре ${genreParam}`,
    trackIds: tracks.map((t) => t.id),
    status: "published"
  } as any;

  if (!tracks.length) {
    return (
      <main className="px-4 pb-24 pt-10 md:px-8 lg:px-12">
        <p className="text-sm text-[var(--muted)]">В этом жанре пока нет треков.</p>
      </main>
    );
  }

  return <PlaylistView playlist={playlistLike} tracks={tracks} />;
}
