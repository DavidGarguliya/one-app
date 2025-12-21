import { PlaylistDTO, TrackDTO, TagDTO } from "@one-app/types";

export const tags: TagDTO[] = [
  { id: "t1", type: "genre", slug: "electronic", name: "Electronic" },
  { id: "t2", type: "mood", slug: "focus", name: "Focus" },
  { id: "t3", type: "occasion", slug: "commute", name: "Commute" }
];

export const tracks: TrackDTO[] = Array.from({ length: 10 }).map((_, idx) => ({
  id: `track-${idx + 1}`,
  title: `Night Drive ${idx + 1}`,
  artist: "Analog Waves",
  duration: 210 + idx * 5,
  audioUrl: `https://cdn.example.com/audio/night-drive-${idx + 1}.mp3`,
  coverUrl: "https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=600&q=80",
  genre: "Electronic",
  occasion: idx % 2 === 0 ? "Focus" : "Commute",
  story: "Песня создана по мотивам личной истории и ночных поездок.",
  clientRequest: "Сделать трек в стиле synthwave про ночной город.",
  tags,
  status: "published",
  createdAt: new Date().toISOString(),
  publishedAt: new Date().toISOString()
}));

export const playlists: PlaylistDTO[] = [
  {
    id: "pl-1",
    title: "Deep Focus",
    description: "Keep your flow with minimal beats",
    coverUrl: "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=600&q=80",
    trackIds: tracks.slice(0, 5).map((t) => t.id),
    status: "published",
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  },
  {
    id: "pl-2",
    title: "Night Drive",
    description: "Cinematic electronic for late sessions",
    coverUrl: "https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=600&q=80",
    trackIds: tracks.slice(5).map((t) => t.id),
    status: "published",
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  }
];
