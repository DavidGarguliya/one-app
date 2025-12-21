const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Ошибка ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  listTracks: () => request<any[]>("/v1/tracks"),
  getTrack: (id: string) => request<any>(`/v1/tracks/${id}`),
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
  listUsers: () => request<any[]>("/v1/users")
};
