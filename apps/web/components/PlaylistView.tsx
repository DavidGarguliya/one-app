"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@one-app/ui";
import { PlaylistDTO, TrackDTO } from "@one-app/types";
import { usePlayerStore } from "@one-app/player";
import { Play, Shuffle } from "@phosphor-icons/react";
import { resolveAudioUrl, toAudioTrack } from "@/lib/audioSource";
const placeholder = "/cover-placeholder.svg";

export default function PlaylistView({ playlist, tracks }: { playlist: PlaylistDTO; tracks: TrackDTO[] }) {
  const heroTracks = tracks.slice(-4).reverse();
  const heroCovers = heroTracks
    .filter((t) => t.coverUrl)
    .map((t) => t.coverUrl as string);
  const mosaic = heroCovers.length
    ? Array.from({ length: 4 }, (_, i) => heroCovers[i % heroCovers.length])
    : [];
  const player = usePlayerStore();
  const { currentTrack, isPlaying } = player;
  const router = useRouter();

  const buildQueue = async () => {
    const resolved = await Promise.all(
      tracks
        .filter((t) => t?.id)
        .map(async (t) => {
          const url = await resolveAudioUrl(t);
          if (!url) return null;
          const trackWithUrl = toAudioTrack(t, url);
          return { ...trackWithUrl, coverUrl: trackWithUrl.coverUrl || placeholder };
        })
    );
    return resolved.filter(Boolean) as any[];
  };

  const handlePlay = async (shuffle = false) => {
    const queue = await buildQueue();
    if (!queue.length) return;
    player.setQueue(queue, 0, { type: "playlist", id: playlist.id });
    if (shuffle && !player.shuffle) player.toggleShuffle();
    if (!shuffle && player.shuffle) player.toggleShuffle();
    player.play();
  };
  return (
    <main className="px-4 pb-24 pt-10 md:px-8 lg:px-12 space-y-6">
      <button
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
          } else {
            router.push("/catalog");
          }
        }}
        className="inline-flex items-center gap-2 text-sm text-[var(--fg)]/70 hover:text-[var(--fg)] transition-colors"
      >
        ← Назад
      </button>
      <div className="rounded-3xl border border-[var(--border-strong)] bg-[color-mix(in srgb,var(--bg) 70%,transparent)] shadow-[var(--shadow-card)] overflow-hidden relative w-full md:w-2/3 mr-auto">
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent z-10" />
        <div className="absolute left-0 right-0 bottom-0 z-20 p-4 md:p-6 flex flex-col gap-1">
          <p className="text-xs text-white/70 uppercase tracking-wide">Плейлист</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">{playlist.title}</h1>
          <p className="text-sm md:text-base text-white/85 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">{playlist.description || "Подборка персональных треков ProSound"}</p>
        </div>
        <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2">
          <button
            onClick={() => handlePlay(false)}
            className="h-11 w-11 rounded-full bg-white/85 text-[#0a0d14] flex items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,0.35)] hover:scale-105 transition-all duration-200 ease-out"
            aria-label="Проиграть плейлист"
          >
            <Play weight="fill" size={22} />
          </button>
          <button
            onClick={() => handlePlay(true)}
            className="h-11 w-11 rounded-full bg-white/75 text-[#0a0d14] flex items-center justify-center border border-white/40 backdrop-blur-sm hover:scale-105 transition-all duration-200 ease-out"
            aria-label="Перемешать плейлист"
          >
            <Shuffle weight="bold" size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 grid-rows-2 h-48 md:h-64">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="relative bg-[var(--card)]">
              {mosaic[idx] ? (
                <Image src={mosaic[idx]} alt={playlist.title} fill className="object-cover" sizes="(min-width:768px) 33vw, 50vw" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[11px] text-[var(--muted)]">Нет обложки</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {tracks.map((track) => (
          <Card
            key={track.id}
            interactive={false}
            className="group flex items-center gap-3 bg-transparent border-none py-2 transition-all duration-200 ease-out"
          >
            <div className="relative h-10 w-10 bg-white/10 overflow-hidden rounded-md">
              <Image src={track.coverUrl || placeholder} alt={track.title} fill className="object-cover" sizes="40px" />
              <button
                type="button"
                onClick={async () => {
                  const queue = await buildQueue();
                  if (!queue.length) return;
                  const ids = queue.map((t) => t.id);
                  const idx = ids.indexOf(track.id);
                  if (currentTrack?.id === track.id) {
                    isPlaying ? player.pause() : player.play();
                  } else {
                    player.setQueue(queue, Math.max(0, idx), { type: "playlist", id: playlist.id });
                    player.play();
                  }
                }}
                  className={`absolute inset-0 z-10 flex items-center justify-center bg-black/45 transition-all duration-200 ease-out hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] pointer-events-auto ${
                    currentTrack?.id === track.id && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                aria-label={currentTrack?.id === track.id && isPlaying ? "Пауза" : "Играть"}
              >
                {currentTrack?.id === track.id && isPlaying ? (
                  <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-[var(--accent-strong)]">
                    <rect x="6" y="5" width="4" height="14" />
                    <rect x="14" y="5" width="4" height="14" />
                  </svg>
                ) : (
                  <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-[var(--accent-strong)]">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/tracks/${track.id}`} className="block">
                <p
                  className={`font-medium line-clamp-1 transition-colors ${
                    currentTrack?.id === track.id
                      ? "text-[var(--accent-strong)]"
                      : "group-hover:text-[var(--accent-strong)]"
                  }`}
                >
                  {track.title}
                </p>
                <p
                  className={`text-sm line-clamp-1 transition-colors ${
                    currentTrack?.id === track.id
                      ? "text-white/80"
                      : "text-white/60 group-hover:text-white/75"
                  }`}
                >
                  {track.artist}
                </p>
              </Link>
            </div>
            <span className="text-sm text-white/60">
              {track.duration ? `${Math.floor(track.duration / 60)}:${`${Math.floor(track.duration % 60)}`.padStart(2, "0")}` : "—"}
            </span>
          </Card>
        ))}
        {!tracks.length && <p className="text-sm text-white/60">В этом плейлисте пока нет треков.</p>}
      </div>
    </main>
  );
}
