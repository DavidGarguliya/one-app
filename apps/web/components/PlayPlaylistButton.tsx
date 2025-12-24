"use client";

import { Button } from "@one-app/ui";
import { usePlayerStore } from "@one-app/player";
import { PlaylistDTO, TrackDTO } from "@one-app/types";

export function PlayPlaylistButton({ playlist, tracks }: { playlist: PlaylistDTO; tracks: TrackDTO[] }) {
  const { setQueue, play, toggleShuffle } = usePlayerStore();
  const mapQueue = () =>
    playlist.trackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => ({
        id: t!.id,
        url: (t as any).audioUrl || (t as any).url,
        title: t!.title,
        artist: t!.artist || "",
        coverUrl: t!.coverUrl
      }));
  const loadQueue = (shuffle = false) => {
    const mapped = mapQueue();
    if (!mapped.length) return;
    setQueue(mapped, 0);
    if (shuffle) toggleShuffle();
    play();
  };
  return (
    <div className="flex gap-2">
      <Button onClick={() => loadQueue(false)}>Play</Button>
      <Button variant="ghost" onClick={() => loadQueue(true)}>
        Shuffle
      </Button>
    </div>
  );
}
