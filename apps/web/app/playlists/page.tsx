import Link from "next/link";
import { fetchPlaylists, fetchTracks } from "../../lib/api";

export default async function PlaylistsPage() {
  const [playlists, tracks] = await Promise.all([fetchPlaylists().catch(() => []), fetchTracks().catch(() => [])]);
  return (
    <main className="px-4 pb-24 pt-10 md:px-8 lg:px-12 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-[var(--fg)]/60">Сборники</p>
          <h1 className="text-2xl font-semibold">Плейлисты</h1>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((pl) => {
          const count = pl.trackIds?.length || 0;
          const cover = tracks.find((t) => pl.trackIds?.includes(t.id))?.coverUrl;
          return (
            <Link key={pl.id} href={`/playlists/${pl.id}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-white/5 transition block">
              {cover ? <img src={cover} alt="cover" className="h-40 w-full object-cover rounded-xl mb-3" /> : <div className="h-40 w-full rounded-xl bg-white/5 border border-white/10 mb-3" />}
              <h3 className="text-lg font-semibold text-[var(--fg)]">{pl.title}</h3>
              <p className="text-sm text-[var(--fg)]/70 line-clamp-2">{pl.description || ""}</p>
              <p className="text-xs text-[var(--fg)]/60 mt-2">{count} треков</p>
            </Link>
          );
        })}
        {!playlists.length && <p className="text-sm text-[var(--fg)]/60">Плейлистов пока нет.</p>}
      </div>
    </main>
  );
}
