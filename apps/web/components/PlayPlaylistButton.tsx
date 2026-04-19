"use client";

import { Button } from "@one-app/ui";
import { usePlayerStore } from "@one-app/player";
import { PlaylistDTO, TrackDTO } from "@one-app/types";
import { resolveAudioUrl, toAudioTrack } from "@/lib/audioSource";

export function PlayPlaylistButton({ playlist, tracks }: { playlist: PlaylistDTO; tracks: TrackDTO[] }) {
  const { setQueue, play, toggleShuffle } = usePlayerStore();

  const mapQueue = async () => {
    const resolved = await Promise.all(
      playlist.trackIds.map(async (id) => {
        const t = tracks.find((tr) => tr.id === id);
        if (!t) return null;
        const url = await resolveAudioUrl(t);
        if (!url) return null;
        return toAudioTrack(t, url);
      })
    );
    return resolved.filter(Boolean) as any[];
  };
  const loadQueue = async (shuffle = false) => {
    const mapped = await mapQueue();
    if (!mapped.length) return;
    setQueue(mapped, 0, { type: "playlist", id: playlist.id });
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
