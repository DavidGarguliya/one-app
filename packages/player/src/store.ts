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
};

export type PlayerActions = {
  setQueue: (tracks: AudioTrack[], startIndex?: number) => void;
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
  volume: 1
};

// Some external sources (e.g. Apple Music previews) ship tiny 64x64 covers.
// Bump them to a larger size so the UI doesn't look blurry.
const upscaleCover = (url?: string) => {
  if (!url) return url;
  return url.replace(/\/\d+x\d+bb\./i, "/600x600bb.");
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => {
  const sync = () => {
    const state = audioEngine.state();
    set({
      currentTrack: state.current,
      queue: state.queue,
      currentIndex: state.index,
      duration: state.duration,
      currentTime: state.currentTime,
      isPlaying: !state.paused,
      volume: state.volume
    });
  };

  audioEngine.on("timeupdate", sync);
  audioEngine.on("play", () => set({ isPlaying: true }));
  audioEngine.on("pause", () => set({ isPlaying: false }));
  audioEngine.on("buffering", () => set({ buffering: true }));
  audioEngine.on("loadedmetadata", () => set({ buffering: false, duration: audioEngine.state().duration }));

  return {
    ...initialState,
    setQueue: (tracks, startIndex = 0) => {
      const normalized = tracks.map((t) => ({ ...t, coverUrl: upscaleCover(t.coverUrl) }));
      audioEngine.setQueue(normalized, startIndex);
      sync();
    },
    play: (track) => {
      if (track) {
        audioEngine.setQueue([{ ...track, coverUrl: upscaleCover(track.coverUrl) }], 0);
      }
      audioEngine.play();
      sync();
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
      sync();
    },
    prev: () => {
      audioEngine.prev();
      sync();
    },
    toggleShuffle: () => {
      const nowShuffle = !get().shuffle;
      audioEngine.toggleShuffle();
      set({ shuffle: nowShuffle });
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
