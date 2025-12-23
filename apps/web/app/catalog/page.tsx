import { TrackCard } from "../../components/TrackCard";
import { fetchTracks } from "../../lib/api";
import { tracks as demoTracks } from "../../lib/demoData";

export default async function CatalogPage() {
  const data = await fetchTracks().catch(() => []);
  const tracks = data.length ? data : demoTracks;
  const defaultGenres = ["Pop", "Acoustic", "Cinematic", "Ballad", "Epic", "Jazz", "Classical", "Electronic", "Dance", "Chill / Ambient"];
  const genres = Array.from(
    new Set(
      [
        ...tracks.map((t) => (t.genre || "").trim()).filter(Boolean),
        ...defaultGenres
      ].map((g) => g.toString())
    )
  );
  return (
    <main className="px-4 pb-24 pt-10 md:px-8 lg:px-12 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-[var(--fg)]/60">Каталог</p>
          <h1 className="text-2xl font-semibold">Все треки</h1>
        </div>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--fg)]">Жанры</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {genres.map((g) => (
            <div
              key={g}
              className="rounded-2xl border border-[var(--border-strong)] bg-[color-mix(in srgb,var(--bg) 70%,transparent)] px-4 py-3 shadow-[var(--shadow-card)] flex items-center justify-between gap-2"
            >
              <span className="text-sm font-medium text-[var(--fg)] truncate">{g}</span>
              <span className="h-6 w-6 rounded-full bg-white/10 border border-white/10" />
            </div>
          ))}
        </div>
      </section>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="flex gap-4 pb-2 min-w-max">
          {tracks.map((track, idx) => (
            <TrackCard key={track.id} track={track} variant="compact" queue={tracks} index={idx} />
          ))}
          {!tracks.length && <p className="text-sm text-[var(--fg)]/60">Нет треков.</p>}
        </div>
      </div>
    </main>
  );
}
