"use client";

import { Button } from "@one-app/ui";
import { usePlayerStore } from "@one-app/player";
import { PlaylistDTO } from "@one-app/types";
import { tracks } from "../lib/demoData";

function mapQueue(playlist: PlaylistDTO) {
  return playlist.trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => ({
      id: t!.id,
      url: t!.audioUrl,
      title: t!.title,
      artist: t!.artist || "",
      coverUrl: t!.coverUrl
    }));
}

export function PlayPlaylistButton({ playlist }: { playlist: PlaylistDTO }) {
  const { setQueue, play, toggleShuffle } = usePlayerStore();
  const loadQueue = (shuffle = false) => {
    const mapped = mapQueue(playlist);
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
