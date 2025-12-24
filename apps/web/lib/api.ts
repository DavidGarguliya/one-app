import { TrackDTO, PlaylistDTO } from "@one-app/types";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
const apiBase = API_URL || "";

const onlyPublished = (items: TrackDTO[]) =>
  (items || []).filter((t) => !t.status || t.status === "published");

const withProxyAudio = (items: TrackDTO[]) =>
  items.map((t) => {
    const audioUrl = t.audioUrl
      ? `${apiBase}/v1/tracks/proxy?url=${encodeURIComponent(t.audioUrl)}`
      : t.audioUrl;
    return { ...t, audioUrl };
  });

export async function fetchTracks(): Promise<TrackDTO[]> {
  const res = await fetch(`${apiBase}/v1/tracks`, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error("Failed to fetch tracks");
  }
  const data = (await res.json()) as TrackDTO[];
  return withProxyAudio(onlyPublished(data));
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function fetchFeaturedTrack(): Promise<TrackDTO | null> {
  try {
    const res = await fetch(`${apiBase}/v1/tracks/featured`, { cache: "no-store" });
    if (!res.ok) return null;
    const track = await safeJson<TrackDTO>(res);
    if (track && track.status && track.status !== "published") return null;
    return track;
  } catch {
    return null;
  }
}

export async function fetchLatestTracks(limit = 8): Promise<TrackDTO[]> {
  try {
    const res = await fetch(`${apiBase}/v1/tracks/latest`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await safeJson<TrackDTO[]>(res)) || [];
    return withProxyAudio(onlyPublished(data)).slice(0, limit);
  } catch {
    return [];
  }
}


export async function fetchTrack(id: string): Promise<TrackDTO | null> {
  try {
    const res = await fetch(`${apiBase}/v1/tracks/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const track = await safeJson<TrackDTO>(res);
    if (!track) return null;
    return withProxyAudio([track])[0];
  } catch {
    return null;
  }
}

export async function fetchPlaylists(): Promise<PlaylistDTO[]> {
  try {
    const res = await fetch(`${apiBase}/v1/playlists`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await safeJson<PlaylistDTO[]>(res)) || [];
    return data.filter(
      (pl) =>
        (!pl.status || pl.status === "published") &&
        Array.isArray(pl.trackIds) &&
        pl.trackIds.length > 0
    );
  } catch {
    return [];
  }
}

export async function fetchPlaylist(id: string): Promise<PlaylistDTO | null> {
  try {
    const res = await fetch(`${apiBase}/v1/playlists/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await safeJson<PlaylistDTO>(res);
  } catch {
    return null;
  }
}
