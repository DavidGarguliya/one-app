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
  private index = 0;
  private initialized = false;
  constructor() {
    super();
    // Avoid Node EventEmitter throwing when `error` is emitted without listeners.
    this.on("error", () => {});
  }


  get current(): AudioTrack | null {
    return this.queue[this.index] ?? null;
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
    this.index = Math.max(0, Math.min(startIndex, queue.length - 1));
    if (this.queue.length) {
      this.load(this.queue[this.index]);
    }
  }

  private handleEnded() {
    if (this.repeat === "one") {
      this.seek(0);
      this.play();
      return;
    }
    if (this.index < this.queue.length - 1) {
      this.next();
    } else if (this.repeat === "all" && this.queue.length) {
      this.index = 0;
      this.load(this.queue[this.index]);
      this.play();
    } else {
      this.emit("ended");
    }
  }

  load(track: AudioTrack) {
    if (!this.audio) this.init();
    if (!this.audio) return;
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
    if (this.index < this.queue.length - 1) {
      this.index += 1;
      this.load(this.queue[this.index]);
      this.play();
    }
  }

  prev() {
    if (this.index > 0) {
      this.index -= 1;
      this.load(this.queue[this.index]);
      this.play();
    }
  }

  toggleShuffle() {
    this.queue = this.queue.sort(() => Math.random() - 0.5);
    this.index = 0;
    if (this.queue.length) this.load(this.queue[this.index]);
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
      ready: this.initialized
    };
  }
}

export const audioEngine = new AudioEngine();
