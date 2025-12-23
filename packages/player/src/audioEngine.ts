import { EventEmitter } from "events";

export type RepeatMode = "off" | "one" | "all";

export type AudioTrack = {
  id: string;
  url: string;
  title: string;
  artist?: string;
  duration?: number;
  coverUrl?: string;
};

export type AudioEvents =
  | "timeupdate"
  | "ended"
  | "buffering"
  | "play"
  | "pause"
  | "error"
  | "loadedmetadata";

class AudioEngine extends EventEmitter {
  private audio: HTMLAudioElement | null = null;
  private repeat: RepeatMode = "off";
  private queue: AudioTrack[] = [];
  private order: number[] = [];
  private orderIndex = 0;
  private shuffle = false;
  private initialized = false;
  constructor() {
    super();
    // Avoid Node EventEmitter throwing when `error` is emitted without listeners.
    this.on("error", () => {});
  }


  get current(): AudioTrack | null {
    const idx = this.order[this.orderIndex] ?? 0;
    return this.queue[idx] ?? null;
  }

  init() {
    if (this.initialized) return;
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.bindEvents();
    this.initialized = true;
  }

  private bindEvents() {
    if (!this.audio) return;
    this.audio.addEventListener("timeupdate", () => this.emit("timeupdate"));
    this.audio.addEventListener("ended", () => this.handleEnded());
    this.audio.addEventListener("waiting", () => this.emit("buffering"));
    this.audio.addEventListener("play", () => this.emit("play"));
    this.audio.addEventListener("pause", () => this.emit("pause"));
    this.audio.addEventListener("loadedmetadata", () => this.emit("loadedmetadata"));
    this.audio.addEventListener("error", () => this.emit("error"));
  }

  setQueue(queue: AudioTrack[], startIndex = 0) {
    this.queue = queue;
    this.buildOrder(startIndex);
    if (this.queue.length) this.loadCurrent();
  }

  private handleEnded() {
    if (this.repeat === "one") {
      this.seek(0);
      this.play();
      return;
    }
    const hasNext = this.orderIndex < this.order.length - 1;
    if (hasNext) {
      this.orderIndex += 1;
      this.loadCurrent();
      this.play();
      return;
    }
    if (this.repeat === "all" && this.queue.length) {
      this.orderIndex = 0;
      this.loadCurrent();
      this.play();
      return;
    }
    this.emit("ended");
  }

  private loadCurrent() {
    if (!this.audio) this.init();
    if (!this.audio) return;
    const track = this.current;
    if (!track) return;
    this.audio.src = track.url;
    this.audio.load();
  }

  async play() {
    if (!this.audio) this.init();
    if (!this.audio) return;
    await this.audio.play().catch((err) => {
      this.emit("error", err);
    });
  }

  pause() {
    this.audio?.pause();
  }

  seek(time: number) {
    if (this.audio) this.audio.currentTime = time;
  }

  setVolume(volume: number) {
    if (this.audio) this.audio.volume = volume;
  }

  next() {
    const hasNext = this.orderIndex < this.order.length - 1;
    if (!hasNext) {
      if (this.repeat === "all" && this.order.length) {
        this.orderIndex = 0;
        this.loadCurrent();
        this.play();
      }
      return;
    }
    this.orderIndex += 1;
    this.loadCurrent();
    this.play();
  }

  prev() {
    if (this.audio && this.audio.currentTime > 3) {
      this.seek(0);
      this.play();
      return;
    }
    const hasPrev = this.orderIndex > 0;
    if (!hasPrev) {
      if (this.repeat === "all" && this.order.length) {
        this.orderIndex = this.order.length - 1;
        this.loadCurrent();
        this.play();
      }
      return;
    }
    this.orderIndex -= 1;
    this.loadCurrent();
    this.play();
  }

  private buildOrder(startIndex = 0) {
    const length = this.queue.length;
    if (!length) {
      this.order = [];
      this.orderIndex = 0;
      return;
    }
    const indices = Array.from({ length }, (_, i) => i);
    const clampStart = Math.max(0, Math.min(startIndex, length - 1));
    if (!this.shuffle) {
      this.order = indices;
      this.orderIndex = clampStart;
      return;
    }
    // shuffle but keep current track at head
    const currentIdx = indices.splice(clampStart, 1)[0];
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    this.order = [currentIdx, ...indices];
    this.orderIndex = 0;
  }

  setShuffle(on?: boolean) {
    this.shuffle = on === undefined ? !this.shuffle : on;
    const currentIndex = this.order[this.orderIndex] ?? 0;
    this.buildOrder(currentIndex);
    this.loadCurrent();
  }

  setRepeat(mode: RepeatMode) {
    this.repeat = mode;
  }

  state() {
    return {
      current: this.current,
      queue: this.queue,
      index: this.index,
      duration: this.audio?.duration ?? 0,
      currentTime: this.audio?.currentTime ?? 0,
      paused: this.audio?.paused ?? true,
      volume: this.audio?.volume ?? 1,
      ready: this.initialized,
      shuffle: this.shuffle
    };
  }
}

export const audioEngine = new AudioEngine();
