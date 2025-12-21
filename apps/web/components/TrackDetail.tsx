"use client";
import Image from "next/image";
import Link from "next/link";
import { Card, GlassPanel } from "@one-app/ui";
import { Play } from "@phosphor-icons/react";
import { TrackDTO } from "@one-app/types";
import { PlayButton } from "./PlayButton";
import { CtaButton } from "./CtaButton";
import { usePlayerStore } from "@one-app/player";

export default function TrackDetail({ track, related }: { track: TrackDTO; related: TrackDTO[] }) {
  const player = usePlayerStore();
  const ctaVisible = player.currentTrack?.id === track?.id && player.isPlaying;
  return (
    <main className="px-4 pb-24 pt-10 md:px-8 lg:px-12 space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative h-60 w-60 shrink-0 overflow-hidden rounded-2xl bg-white/5">
          <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="240px" />
        </div>
        <div className="flex-1 space-y-3">
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
            <Link key={item.id} href={`/tracks/${item.id}`} className="group">
              <Card className="flex items-center gap-3 shadow-[0_12px_26px_rgba(0,0,0,0.14)] group-hover:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_70%,transparent),0_14px_28px_rgba(0,0,0,0.2)]">
                <div className="relative h-12 w-12 rounded-xl bg-white/10 overflow-hidden">
                  <Image src={item.coverUrl} alt={item.title} fill className="object-cover" sizes="48px" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-white/60">{item.artist}</p>
                </div>
                <span className="text-sm text-white/60">
                  {item.duration ? `${Math.floor(item.duration / 60)}:${`${Math.floor(item.duration % 60)}`.padStart(2, "0")}` : "—"}
                </span>
                <div className="ml-2 rounded-full bg-black/60 border border-[color-mix(in_srgb,var(--accent)_80%,transparent)] p-2 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_90%,transparent)]">
                  <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-[var(--accent-strong)]">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
          {!related.length && <p className="text-sm text-white/60">Нет похожих треков.</p>}
        </div>
      </section>
    </main>
  );
}
