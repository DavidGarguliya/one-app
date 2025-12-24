"use client";

import { Button } from "@one-app/ui";
import { usePlayerStore } from "@one-app/player";
import { TrackDTO } from "@one-app/types";
import { Play, Pause } from "@phosphor-icons/react";
import { fetchLatestTracks } from "../lib/api";

export function PlayButton({ track, queue }: { track: TrackDTO; queue?: TrackDTO[] }) {
  const { setQueue, play, pause, currentTrack, isPlaying } = usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;

  return (
    <Button
      onClick={async () => {
        // Берем плейлист "последние добавленные" для корректной навигации next/prev
        const latest = await fetchLatestTracks(50).catch(() => []);
        const baseList = latest.length ? latest : queue && queue.length ? queue : [track];
        const list = baseList.map((t) => ({
          id: t.id,
          url: (t as any).audioUrl || (t as any).url,
          title: t.title,
          artist: t.artist || "",
          coverUrl: t.coverUrl
        })) as any[];
        const startIndex = list.findIndex((t) => t.id === track.id);
        if (isCurrent) {
          isPlaying ? pause() : play();
        } else {
          setQueue(list, Math.max(0, startIndex >= 0 ? startIndex : 0));
          play();
        }
      }}
      className={`h-11 w-11 rounded-full p-0 flex items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all duration-200 ${
        isCurrent && isPlaying
          ? "bg-white text-[#0a0d14] scale-95"
          : "bg-[var(--accent)] text-white hover:scale-105"
      }`}
      aria-label={isCurrent && isPlaying ? "Пауза" : "Слушать трек"}
    >
      {isCurrent && isPlaying ? <Pause weight="fill" size={18} /> : <Play weight="fill" size={18} />}
    </Button>
  );
}
