"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@one-app/player";
import { TrackDTO } from "@one-app/types";
import { GiftEnvelope } from "@/components/GiftEnvelope";
import { GiftConfetti } from "@/components/GiftConfetti";

export function GiftPlayerClient({ track, shareUrl }: { track: TrackDTO; shareUrl: string }) {
  const { setQueue, play } = usePlayerStore();

  useEffect(() => {
    if (track) {
      setQueue([{ ...track, url: track.audioUrl }] as any, 0);
    }
  }, [track, setQueue]);

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      <div
        className="absolute inset-0 -z-10 bg-center bg-cover opacity-70 blur-2xl scale-110"
        style={{ backgroundImage: track.coverUrl ? `url(${track.coverUrl})` : undefined }}
      />
      <div className="absolute inset-0 -z-5 bg-gradient-to-b from-black/60 via-black/40 to-black" />
      <GiftConfetti />
      <GiftEnvelope
        title={track.title || "Подарочная песня"}
        message="Нажмите, чтобы открыть подарок и запустить песню."
        onOpen={() => play(track as any)}
      />
      <div className="mt-6 space-y-2 text-center">
        <p className="text-sm text-white/70">Исполнитель: {track.artist || "ProSound"}</p>
        <div className="flex gap-3 justify-center text-sm text-white/80 flex-wrap">
          {track.genre && <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">{track.genre}</span>}
          {track.occasion && <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">{track.occasion}</span>}
          {track.mood && <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">{track.mood}</span>}
        </div>
        <button
          className="mt-2 text-sm text-[var(--accent)] underline decoration-[var(--accent)]/60 underline-offset-4"
          onClick={() => navigator.clipboard.writeText(shareUrl)}
        >
          Скопировать ссылку на подарок
        </button>
      </div>
    </main>
  );
}
