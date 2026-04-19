"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@one-app/player";
import { TrackDTO } from "@one-app/types";
import { GiftEnvelope } from "@/components/GiftEnvelope";
import { GiftConfetti } from "@/components/GiftConfetti";
import { resolveAudioUrl, toAudioTrack } from "@/lib/audioSource";

export function GiftPlayerClient({ track, shareUrl }: { track: TrackDTO; shareUrl: string }) {
  const { setQueue, play } = usePlayerStore();

  const pickPlayableUrl = async (t: TrackDTO) => {
    const direct = t.playbackUrl || t.audioUrl;
    const isPlayable = (url?: string | null) => !!url && /\.(mp3|m4a)(\?|$)/i.test(url);
    if (isPlayable(direct)) return direct!;
    const resolved = await resolveAudioUrl(t);
    return isPlayable(resolved) ? resolved : null;
  };

  useEffect(() => {
    if (track) {
      (async () => {
        const url = await pickPlayableUrl(track);
        if (!url) return;
        setQueue([toAudioTrack(track, url) as any], 0);
      })();
    }
  }, [track, setQueue]);

  const downloads = [
    track.downloadWavUrl ? { label: "Скачать WAV", url: track.downloadWavUrl } : null,
    track.downloadAiffUrl ? { label: "Скачать AIFF", url: track.downloadAiffUrl } : null
  ].filter(Boolean) as { label: string; url: string }[];

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
        {downloads.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 items-center text-sm text-white/80">
            <p className="text-white/70">Скачать оригинал</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {downloads.map((d) => (
                <a
                  key={d.url}
                  href={d.url}
                  download
                  className="px-3 py-1 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 transition"
                >
                  {d.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
