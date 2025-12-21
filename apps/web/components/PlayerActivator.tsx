"use client";

import { useEffect, useState } from "react";
import { audioEngine } from "@one-app/player";
import { Button } from "@one-app/ui";

export const PlayerActivator = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onPlay = () => setReady(true);
    audioEngine.on("play", onPlay);
    return () => {
      audioEngine.off("play", onPlay);
    };
  }, []);

  if (ready) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-center pb-24">
      <div className="pointer-events-auto glass-surface px-4 py-3 rounded-2xl text-center">
        <p className="text-sm text-white/80 mb-2">Tap to enable audio</p>
        <Button
          onClick={() => {
            audioEngine.init();
            setReady(true);
          }}
        >
          Enable playback
        </Button>
      </div>
    </div>
  );
};
