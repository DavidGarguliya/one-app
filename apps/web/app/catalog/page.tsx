import { TrackCard } from "../../components/TrackCard";
import { fetchTracks } from "../../lib/api";
import { tracks as demoTracks } from "../../lib/demoData";

export default async function CatalogPage() {
  const data = await fetchTracks().catch(() => []);
  const tracks = data.length ? data : demoTracks;
  return (
    <main className="px-4 pb-24 pt-10 md:px-8 lg:px-12 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-[var(--fg)]/60">Каталог</p>
          <h1 className="text-2xl font-semibold">Все треки</h1>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="flex gap-4 pb-2 min-w-max">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} variant="compact" />
          ))}
          {!tracks.length && <p className="text-sm text-[var(--fg)]/60">Нет треков.</p>}
        </div>
      </div>
    </main>
  );
}
