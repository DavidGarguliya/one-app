const API = (() => {
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
      // try next candidate
    }
  }
  throw new Error("API base URL is not configured");
})();

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response | null = null;
  let lastErr: any = null;
  const targets = (() => {
    if (/^https?:\/\//i.test(url)) return [url];
    const bases = [
      API,
      process.env.NEXT_PUBLIC_API_URL,
      typeof window !== "undefined" ? window.location.origin : "",
      "http://localhost:4000"
    ].filter(Boolean) as string[];
    return Array.from(new Set(bases.map((b) => `${b}${url}`)));
  })();
  for (const target of targets) {
    try {
      res = await fetch(target, {
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        ...init
      });
      break;
    } catch (err: any) {
      lastErr = err;
      res = null;
    }
  }
  if (!res) {
    throw new Error(`Не удалось обратиться к API (пробовали: ${targets.join(", ")}): ${lastErr?.message || lastErr}`);
  }
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Ошибка ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  listTracks: () => request<any[]>("/v1/tracks"),
  getTrack: (id: string, opts?: { slim?: boolean }) =>
    request<any>(`/v1/tracks/${id}${opts?.slim ? "?slim=1" : ""}`),
  createTrack: (body: any) => request<any>("/v1/tracks", { method: "POST", body: JSON.stringify(body) }),
  createTracksBulk: (items: any[]) =>
    request<any>("/v1/tracks/bulk", { method: "POST", body: JSON.stringify(items) }),
  updateTrack: (id: string, body: any) => request<any>(`/v1/tracks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTrack: (id: string) => request<any>(`/v1/tracks/${id}`, { method: "DELETE" }),
  listPlaylists: () => request<any[]>("/v1/playlists"),
  createPlaylist: (body: any) => request<any>("/v1/playlists", { method: "POST", body: JSON.stringify(body) }),
  updatePlaylist: (id: string, body: any) => request<any>(`/v1/playlists/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deletePlaylist: (id: string) => request<any>(`/v1/playlists/${id}`, { method: "DELETE" }),
  listTags: () => request<any[]>("/v1/tags"),
  createTag: (body: any) => request<any>("/v1/tags", { method: "POST", body: JSON.stringify(body) }),
  updateTag: (id: string, body: any) => request<any>(`/v1/tags/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTag: (id: string) => request<any>(`/v1/tags/${id}`, { method: "DELETE" }),
  listStyles: () => request<any[]>("/v1/styles"),
  createStyle: (body: any) => request<any>("/v1/styles", { method: "POST", body: JSON.stringify(body) }),
  deleteStyle: (id: string) => request<any>(`/v1/styles/${id}`, { method: "DELETE" }),
  listMoods: () => request<any[]>("/v1/moods"),
  createMood: (body: any) => request<any>("/v1/moods", { method: "POST", body: JSON.stringify(body) }),
  deleteMood: (id: string) => request<any>(`/v1/moods/${id}`, { method: "DELETE" }),
  listOccasions: () => request<any[]>("/v1/occasions"),
  createOccasion: (body: any) => request<any>("/v1/occasions", { method: "POST", body: JSON.stringify(body) }),
  deleteOccasion: (id: string) => request<any>(`/v1/occasions/${id}`, { method: "DELETE" }),
  listUsers: () => request<any[]>("/v1/users"),
  requestLyrics: (trackId: string, body: any) =>
    request<any>(`/v1/lyrics/generate/${trackId}`, { method: "POST", body: JSON.stringify(body || {}) }),
  lyricsStatus: (trackId: string) => request<any>(`/v1/lyrics/status/${trackId}`),
  lyricsResult: (trackId: string) => request<any>(`/v1/lyrics/result/${trackId}`),
  lyricsDownloadUrl: (trackId: string) => `${API}/v1/lyrics/download/${trackId}/lrc`
};
