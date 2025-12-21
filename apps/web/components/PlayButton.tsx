"use client";

import { Button } from "@one-app/ui";
import { usePlayerStore } from "@one-app/player";
import { TrackDTO } from "@one-app/types";

export function PlayButton({ track }: { track: TrackDTO }) {
  const { setQueue, play } = usePlayerStore();
  return (
    <Button
      onClick={() => {
        setQueue(
          [
            {
              id: track.id,
              url: track.audioUrl,
              title: track.title,
              artist: track.artist || "",
              coverUrl: track.coverUrl
            }
          ],
          0
        );
        play();
      }}
    >
      Play
    </Button>
  );
}
