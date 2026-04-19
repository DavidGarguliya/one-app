// Utility to lazily fetch full audio URL when slim payloads omit audioUrl.
// Keeps a simple in-memory cache to avoid repeated network calls.
import { TrackDTO } from "@one-app/types";
import { AudioTrack } from "@one-app/player";

const cache = new Map<string, string>();

const apiBase = (() => {
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
      // keep trying
    }
  }
  return "";
})();

const toProxy = (src: string) => `${apiBase}/v1/tracks/proxy?url=${encodeURIComponent(src)}`;

const parseDataUrl = (dataUrl: string) => {
  const [meta, b64] = dataUrl.split(",");
  const mimeMatch = /data:([^;]+);base64/.exec(meta || "");
  const mime = mimeMatch?.[1] || "application/octet-stream";
  const bin = atob(b64 || "");
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return { mime, bytes };
};

const dataUrlToObjectUrl = (dataUrl: string): string => {
  try {
    const { mime, bytes } = parseDataUrl(dataUrl);
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  } catch {
    return dataUrl;
  }
};

const encodeWav = (audioBuffer: AudioBuffer) => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + length * blockAlign);
  const view = new DataView(buffer);

  let offset = 0;
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i += 1) view.setUint8(offset + i, s.charCodeAt(i));
    offset += s.length;
  };
  writeString("RIFF");
  view.setUint32(offset, 36 + length * blockAlign, true); offset += 4;
  writeString("WAVE");

  writeString("fmt ");
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bytesPerSample * 8, true); offset += 2;

  writeString("data");
  view.setUint32(offset, length * blockAlign, true); offset += 4;

  const channelData = Array.from({ length: numChannels }, (_, ch) => audioBuffer.getChannelData(ch));
  for (let i = 0; i < length; i += 1) {
    for (let ch = 0; ch < numChannels; ch += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: "audio/wav" });
};

const dataAiffToWavUrl = async (dataUrl: string): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    const { mime, bytes } = parseDataUrl(dataUrl);
    if (!/aiff/i.test(mime)) return null;
    const ctx = new AudioCtx();
    const decoded = await ctx.decodeAudioData(bytes.buffer.slice(0));
    const wavBlob = encodeWav(decoded);
    const url = URL.createObjectURL(wavBlob);
    if (typeof ctx.close === "function") ctx.close();
    return url;
  } catch {
    return null;
  }
};

const fetchArrayBuffer = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
  return await res.arrayBuffer();
};

const isAiffLike = (url: string) => /\.aif(f)?(\?|$)/i.test(url);

const decodeToWavObjectUrl = async (src: string): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    const ctx = new AudioCtx();
    const arr = await fetchArrayBuffer(src);
    const decoded = await ctx.decodeAudioData(arr);
    const wav = encodeWav(decoded);
    const url = URL.createObjectURL(wav);
    if (typeof ctx.close === "function") ctx.close();
    return url;
  } catch {
    return null;
  }
};

export async function resolveAudioUrl(track: TrackDTO): Promise<string | null> {
  if (!track?.id) return null;
  if (cache.has(track.id)) return cache.get(track.id)!;
  if (track.audioUrl) {
    if (track.audioUrl.startsWith("data:")) {
      const url = `${apiBase}/v1/tracks/${track.id}/audio`;
      cache.set(track.id, url);
      return url;
    }
    if (track.audioUrl.startsWith("http://localhost:9000/")) {
      const proxied = toProxy(track.audioUrl);
      cache.set(track.id, proxied);
      return proxied;
    }
    cache.set(track.id, track.audioUrl);
    return track.audioUrl;
  }
  const fallback = `${apiBase}/v1/tracks/${track.id}/audio`;
  cache.set(track.id, fallback);
  return fallback;
}

export const toAudioTrack = (track: TrackDTO, url: string): AudioTrack => ({
  id: track.id,
  url,
  title: track.title,
  artist: track.artist || "",
  coverUrl: track.coverUrl,
  duration: track.duration,
  lyricsLrcUrl: track.lyricsLrcUrl ?? undefined,
  lyricsJsonUrl: track.lyricsJsonUrl ?? undefined
});
