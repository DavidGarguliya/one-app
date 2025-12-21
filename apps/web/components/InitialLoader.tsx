"use client";
import { useEffect } from "react";
import { fetchFeaturedTrack, fetchLatestTracks } from "../lib/api";
import { usePlayerStore } from "@one-app/player";

export function InitialLoader() {
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const featured = await fetchFeaturedTrack();
      const latest = !featured ? await fetchLatestTracks(1) : [];
      const track = featured || latest[0];
      if (!track || cancelled) return;
      const asAudio = {
        id: track.id,
        url: track.audioUrl,
        title: track.title,
        artist: track.artist || "",
        duration: track.duration,
        coverUrl: track.coverUrl
      };
      usePlayerStore.getState().setQueue([asAudio], 0);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
