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
  playbackUrl?: string; // Опциональный URL для веб-плеера (mp3/m4a)
  downloadWavUrl?: string;
  downloadAiffUrl?: string;
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
  lyricsLrcUrl?: string | null;
  lyricsJsonUrl?: string | null;
  lyricsProvider?: LyricsProvider;
  lyricsUpdatedAt?: string;
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

export type LyricsProvider = "deepgram" | "assemblyai" | "whisper";

export type LyricsJobStatus = "queued" | "processing" | "done" | "error";

export interface LyricsWord {
  word: string;
  start: number;
  end: number;
}

export interface LyricsPayload {
  language: string;
  duration: number;
  words: LyricsWord[];
}

export interface LyricsJob {
  id: string;
  trackId: string;
  status: LyricsJobStatus;
  provider: LyricsProvider;
  language: string;
  resultJsonUrl: string | null;
  lrcUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LyricsResult {
  job: LyricsJob;
  payload?: LyricsPayload;
}
