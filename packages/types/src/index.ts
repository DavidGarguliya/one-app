export type TagType = "genre" | "mood" | "occasion";

export interface TagDTO {
  id: string;
  type: TagType;
  slug: string;
  name: string;
}

export type PublishStatus = "draft" | "published";

export interface TrackDTO {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  audioUrl: string;
  coverUrl: string;
  tags: TagDTO[];
  style?: string;
  mood?: string;
  occasion?: string;
  genre?: string;
  story?: string;
  clientRequest?: string;
  creationStory?: string;
  coverSource?: "embedded" | "uploaded";
  status: PublishStatus;
  createdAt: string;
  publishedAt?: string;
  popularity?: number;
}

export interface PlaylistDTO {
  id: string;
  title: string;
  description?: string;
  coverUrl: string;
  coverGrid?: string[];
  trackIds: string[];
  status: PublishStatus;
  createdAt: string;
  publishedAt?: string;
}

export interface PlaylistMatchExplanation {
  contextScore: number;
  contextSignals: {
    addressing: number;
    story: number;
    emotionalIntensity: number;
    vulnerability: number;
  };
  matched: {
    tags: string[];
    moods: string[];
    styles: string[];
    genres: string[];
    occasions: string[];
  };
  gates: {
    passed: boolean;
    reason?: string;
  };
}

export interface PlaylistMatchResult {
  playlistId: string;
  playlistTitle: string;
  score: number;
  explanation: PlaylistMatchExplanation;
}

export interface UserDTO {
  id: string;
  email: string;
  role: "admin";
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
