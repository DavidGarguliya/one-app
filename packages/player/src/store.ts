import { create } from "zustand";
import { audioEngine, AudioTrack, RepeatMode } from "./audioEngine";

export type PlayerState = {
  queue: AudioTrack[];
  currentIndex: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  buffering: boolean;
  currentTrack: AudioTrack | null;
  volume: number;
  queueContext: {
    type: "home" | "playlist" | "genre" | "custom";
    id?: string;
  };
  hasUserInitiatedPlayback: boolean;
};

export type PlayerActions = {
  setQueue: (tracks: AudioTrack[], startIndex?: number, ctx?: { type: "home" | "playlist" | "genre" | "custom"; id?: string }) => void;
  play: (track?: AudioTrack) => void;
  pause: () => void;
  seek: (time: number) => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  setRepeat: (mode: RepeatMode) => void;
  setVolume: (v: number) => void;
};

const initialState: PlayerState = {
  queue: [],
  currentIndex: 0,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  shuffle: false,
  repeat: "off",
  buffering: false,
  currentTrack: null,
  volume: 1,
  queueContext: { type: "custom" },
  hasUserInitiatedPlayback: false
};

// Some external sources (e.g. Apple Music previews) ship tiny 64x64 covers.
// Bump them to a larger size so the UI doesn't look blurry.
const upscaleCover = (url?: string) => {
  if (!url) return url;
  return url.replace(/\/\d+x\d+bb\./i, "/600x600bb.");
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => {
  const persistedInitiated =
    typeof window !== "undefined" ? window.sessionStorage.getItem("prosound_has_user_played") === "1" : false;

  const sync = () => {
    const state = audioEngine.state();
    set({
      currentTrack: state.current,
      queue: state.queue,
      currentIndex: state.index,
      duration: state.duration,
      currentTime: state.currentTime,
      volume: state.volume,
      shuffle: state.shuffle ?? get().shuffle
    });
  };

  audioEngine.on("timeupdate", sync);
  audioEngine.on("play", () => set({ buffering: true }));
  audioEngine.on("playing", () => set({ isPlaying: true, buffering: false }));
  audioEngine.on("pause", () => set({ isPlaying: false, buffering: false }));
  audioEngine.on("error", () => set({ isPlaying: false, buffering: false }));
  audioEngine.on("ended", () => set({ isPlaying: false, buffering: false }));
  audioEngine.on("buffering", () => set({ buffering: true }));
  audioEngine.on("loadedmetadata", () => {
    set({ buffering: false, duration: audioEngine.state().duration });
    sync();
  });

  return {
    ...initialState,
    hasUserInitiatedPlayback: persistedInitiated,
    setQueue: (tracks, startIndex = 0, ctx) => {
      const normalized = tracks.map((t) => ({ ...t, coverUrl: upscaleCover(t.coverUrl) }));
      audioEngine.setQueue(normalized, startIndex);
      set({
        queueContext: ctx || get().queueContext,
        hasUserInitiatedPlayback: get().hasUserInitiatedPlayback
      });
      sync();
    },
    play: (track) => {
      if (!get().hasUserInitiatedPlayback && typeof window !== "undefined") {
        window.sessionStorage.setItem("prosound_has_user_played", "1");
      }
      set({ hasUserInitiatedPlayback: true });
      if (track) {
        audioEngine.setQueue([{ ...track, coverUrl: upscaleCover(track.coverUrl) }], 0);
      }
      set({ buffering: true });
      audioEngine.play().catch(() => {
        set({ isPlaying: false, buffering: false });
      });
    },
    pause: () => {
      audioEngine.pause();
      sync();
    },
    seek: (time) => {
      audioEngine.seek(time);
      sync();
    },
    next: () => {
      audioEngine.next();
      set({ buffering: true });
    },
    prev: () => {
      audioEngine.prev();
      set({ buffering: true });
    },
    toggleShuffle: () => {
      audioEngine.setShuffle();
      set({ shuffle: audioEngine.state().shuffle ?? false });
      sync();
    },
    setRepeat: (mode) => {
      audioEngine.setRepeat(mode);
      set({ repeat: mode });
    },
    setVolume: (v) => {
      audioEngine.setVolume(v);
      sync();
    }
  };
});
