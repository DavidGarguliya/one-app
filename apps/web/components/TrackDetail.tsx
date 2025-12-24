"use client";
import Image from "next/image";
import Link from "next/link";
import { Card, GlassPanel } from "@one-app/ui";
import { Play } from "@phosphor-icons/react";
import { TrackDTO } from "@one-app/types";
import { PlayButton } from "./PlayButton";
import { CtaButton } from "./CtaButton";
import { usePlayerStore } from "@one-app/player";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export default function TrackDetail({ track, related }: { track: TrackDTO; related: TrackDTO[] }) {
  const player = usePlayerStore();
  const { currentTrack, isPlaying } = player;
  const ctaVisible = player.currentTrack?.id === track?.id && player.isPlaying;
  const router = useRouter();
  const relatedQueue = related
    .filter((t) => (t as any).audioUrl || (t as any).url)
    .map((t) => ({
      id: t.id,
      url: (t as any).audioUrl || (t as any).url,
      title: t.title,
      artist: t.artist || "",
      coverUrl: t.coverUrl
    })) as any[];

  return (
    <main className="px-4 pb-24 pt-10 md:px-8 lg:px-12 space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative h-60 w-60 shrink-0 overflow-hidden rounded-2xl bg-white/5">
          <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="240px" />
        </div>
        <div className="flex-1 space-y-3">
          <button
            className="inline-flex items-center gap-2 text-sm text-[var(--fg)]/70 hover:text-[var(--fg)] transition"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/catalog");
              }
            }}
          >
            <ArrowLeft size={16} /> Назад
          </button>
          <p className="text-sm text-white/60">Трек</p>
          <h1 className="text-3xl font-semibold">{track.title}</h1>
          <p className="text-lg text-white/70">{track.artist}</p>
          <div className="flex gap-2">
            <PlayButton track={track} />
            <GlassPanel padding={false} className="px-3 py-2 text-sm">
              {track.duration ? `${Math.floor(track.duration / 60)}:${`${Math.floor(track.duration % 60)}`.padStart(2, "0")}` : "—"}
            </GlassPanel>
            {ctaVisible && <CtaButton href="/order" size="sm">Хочу такую же историю</CtaButton>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {track.genre && (
              <GlassPanel padding={false} className="px-3 py-1 text-xs">Жанр: {track.genre}</GlassPanel>
            )}
            {track.occasion && (
              <GlassPanel padding={false} className="px-3 py-1 text-xs">Повод: {track.occasion}</GlassPanel>
            )}
            {track.mood && (
              <GlassPanel padding={false} className="px-3 py-1 text-xs">Настроение: {track.mood}</GlassPanel>
            )}
          </div>
        </div>
      </div>
      <section className="space-y-3">
        {track.story && (
          <Card>
            <h2 className="text-lg font-semibold mb-2">История</h2>
            <p className="text-white/70 whitespace-pre-line">{track.story}</p>
          </Card>
        )}
        {track.clientRequest && (
          <Card>
            <h3 className="text-sm font-semibold text-white/80 mb-1">Запрос клиента (анонимизирован)</h3>
            <p className="text-white/60 text-sm whitespace-pre-line">{track.clientRequest}</p>
          </Card>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Похожие треки</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {related.map((item) => (
            <Card key={item.id} interactive={false} className="group flex items-center gap-3 bg-transparent border-none py-2 transition-all duration-200 ease-out">
              <div className="relative h-10 w-10 bg-white/10 overflow-hidden rounded-md">
                <Image src={item.coverUrl} alt={item.title} fill className="object-cover" sizes="40px" />
                <button
                  type="button"
                  onClick={() => {
                    const ids = relatedQueue.map((t) => t.id);
                    const idx = ids.indexOf(item.id);
                    if (currentTrack?.id === item.id) {
                      isPlaying ? player.pause() : player.play();
                    } else {
                      player.setQueue(relatedQueue, Math.max(0, idx));
                      player.play();
                    }
                  }}
                  className={`absolute inset-0 z-10 flex items-center justify-center bg-black/45 transition-all duration-200 ease-out hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] pointer-events-auto ${
                    currentTrack?.id === item.id && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  aria-label={currentTrack?.id === item.id && isPlaying ? "Пауза" : "Играть"}
                >
                  {currentTrack?.id === item.id && isPlaying ? (
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
                <Link href={`/tracks/${item.id}`} className="block">
                  <p
                    className={`font-medium line-clamp-1 transition-colors ${
                      currentTrack?.id === item.id ? "text-[var(--accent-strong)]" : "group-hover:text-[var(--accent-strong)]"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p
                    className={`text-sm line-clamp-1 transition-colors ${
                      currentTrack?.id === item.id ? "text-white/80" : "text-white/60 group-hover:text-white/75"
                    }`}
                  >
                    {item.artist}
                  </p>
                </Link>
              </div>
              <span
                className={`text-sm transition-colors ${
                  currentTrack?.id === item.id ? "text-[var(--accent-strong)]" : "text-white/60 group-hover:text-white/75"
                }`}
              >
                {item.duration ? `${Math.floor(item.duration / 60)}:${`${Math.floor(item.duration % 60)}`.padStart(2, "0")}` : "—"}
              </span>
            </Card>
          ))}
          {!related.length && <p className="text-sm text-white/60">Нет похожих треков.</p>}
        </div>
      </section>
    </main>
  );
}
