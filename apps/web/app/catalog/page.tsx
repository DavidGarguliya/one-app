import Link from "next/link";
import { TrackCard } from "../../components/TrackCard";
import { fetchTracks } from "../../lib/api";
import { tracks as demoTracks } from "../../lib/demoData";

export default async function CatalogPage({ searchParams }: { searchParams: { genre?: string } }) {
  const genreFilter = searchParams?.genre;
  const data = await fetchTracks().catch(() => []);
  const tracks = data.length ? data : demoTracks;
  const filtered = genreFilter
    ? tracks.filter((t) => (t.genre || "").toLowerCase() === genreFilter.toLowerCase())
    : tracks;
  const genres = Object.values(
    tracks
      .filter((t) => t.genre)
      .reduce<Record<string, { name: string; items: typeof tracks }>>((acc, t) => {
        const key = (t.genre || "").trim();
        if (!key) return acc;
        if (!acc[key]) acc[key] = { name: key, items: [] };
        acc[key].items.push(t);
        return acc;
      }, {})
  ).filter((g) => g.items.length > 0);

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
        <div className="flex flex-wrap gap-4 justify-start">
          {genres.map((g) => {
            const coversSrc = g.items.slice(-4).map((t) => t.coverUrl).filter(Boolean) as string[];
            const covers = coversSrc.length
              ? Array.from({ length: 4 }, (_, i) => coversSrc[i % coversSrc.length])
              : [];
            return (
              <Link
                key={g.name}
                href={`/genres/${encodeURIComponent(g.name)}`}
                className="relative w-full max-w-[256px] aspect-square rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] shadow-[var(--shadow-card)] overflow-hidden block transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.25)] hover:border-[var(--accent)]"
              >
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={`${g.name}-${idx}`} className="relative bg-[color-mix(in srgb,var(--bg) 70%,transparent)]">
                      {covers[idx] ? (
                        <img src={covers[idx]} alt={g.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-[var(--muted)] bg-[var(--border)]">
                          {g.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-base font-semibold text-white drop-shadow-sm truncate">{g.name}</p>
                  <p className="text-xs text-white/75 drop-shadow-sm">{g.items.length} трека(ов)</p>
                </div>
              </Link>
            );
          })}
          {!genres.length && <p className="text-sm text-[var(--muted)]">Жанров с треками пока нет.</p>}
        </div>
      </section>
      <div className="space-y-6">
        {genres.map((g) => (
          <div key={`lane-${g.name}`} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-base font-semibold text-[var(--fg)]">{g.name}</p>
              <span className="text-xs text-[var(--muted)]">{g.items.length} трек(ов)</span>
            </div>
            <div className="-mx-4 md:-mx-8 lg:-mx-12 overflow-x-auto scrollbar-thin px-4 md:px-8 lg:px-12">
              <div className="flex gap-4 pb-3 min-w-max">
                {g.items.map((track, idx) => (
                  <TrackCard
                    key={`${g.name}-${track.id}`}
                    track={track}
                    variant="compact"
                    queue={g.items}
                    index={idx}
                    href={`/genres/${encodeURIComponent(g.name)}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
        {!genres.length && (
          <div className="-mx-4 md:-mx-8 lg:-mx-12 overflow-x-auto scrollbar-thin px-4 md:px-8 lg:px-12">
            <div className="flex gap-4 pb-3 min-w-max">
              {filtered.map((track, idx) => (
                <TrackCard key={track.id} track={track} variant="compact" queue={filtered} index={idx} />
              ))}
              {!filtered.length && <p className="text-sm text-[var(--fg)]/60">Нет треков.</p>}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
