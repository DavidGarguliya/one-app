import { TrackDTO, PlaylistDTO } from "@one-app/types";

export const apiBase = (() => {
  const candidates = [
    process.env.NEXT_PUBLIC_API_URL,
    typeof window !== "undefined" ? window.location.origin : "",
    "http://localhost:4000"
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      const basePath = parsed.pathname.replace(/\/$/, "");
      return `${parsed.origin}${basePath}`;
    } catch {
      // try next
    }
  }
  return "";
})();

const onlyPublished = (items: TrackDTO[]) =>
  (items || []).filter((t) => !t.status || t.status === "published");

const withProxyAudio = (items: TrackDTO[]) =>
  items.map((t) => {
    if (!t.audioUrl) return t;
    const audioUrl = `${apiBase}/v1/tracks/proxy?url=${encodeURIComponent(t.audioUrl)}`;
    return { ...t, audioUrl };
  });

export async function fetchTracks({ slim = true }: { slim?: boolean } = {}): Promise<TrackDTO[]> {
  const res = await fetch(`${apiBase}/v1/tracks${slim ? "?slim=1" : ""}`, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error("Failed to fetch tracks");
  }
  const data = (await res.json()) as TrackDTO[];
  const published = onlyPublished(data);
  return slim ? published : withProxyAudio(published);
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

export async function fetchFeaturedTrack({ slim = true }: { slim?: boolean } = {}): Promise<TrackDTO | null> {
  try {
    const res = await fetch(`${apiBase}/v1/tracks/featured${slim ? "?slim=1" : ""}`, { cache: "no-store" });
    if (!res.ok) return null;
    const track = await safeJson<TrackDTO>(res);
    if (track && track.status && track.status !== "published") return null;
    return slim && track ? { ...track, audioUrl: "" } : track;
  } catch {
    return null;
  }
}

export async function fetchLatestTracks(limit = 8, slim = true): Promise<TrackDTO[]> {
  try {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (slim) params.set("slim", "1");
    const res = await fetch(`${apiBase}/v1/tracks/latest?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = onlyPublished((await safeJson<TrackDTO[]>(res)) || []);
    const payload = slim ? data : withProxyAudio(data);
    return payload.slice(0, limit);
  } catch {
    return [];
  }
}


export async function fetchTrack(id: string, { slim = true }: { slim?: boolean } = {}): Promise<TrackDTO | null> {
  try {
    const res = await fetch(`${apiBase}/v1/tracks/${id}${slim ? "?slim=1" : ""}`, { cache: "no-store" });
    if (!res.ok) return null;
    const track = await safeJson<TrackDTO>(res);
    if (!track) return null;
    if (slim) return track;
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
