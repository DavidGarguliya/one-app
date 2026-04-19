"use client";
import Link from "next/link";
import Image from "next/image";
import clsx from "classnames";
import { TrackDTO } from "@one-app/types";
import { Play } from "@phosphor-icons/react";
import { usePlayerStore } from "@one-app/player";
import { resolveAudioUrl, toAudioTrack } from "@/lib/audioSource";
const placeholder = "/cover-placeholder.svg";

type Props = {
  track: TrackDTO;
  variant?: "grid" | "compact";
  queue?: TrackDTO[];
  index?: number;
  href?: string;
};

export function TrackCard({ track, variant = "grid", queue, index = 0, href }: Props) {
  const { setQueue, play } = usePlayerStore();

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const baseList = queue && queue.length ? queue : [track];
    const withUrls = await Promise.all(
      baseList.map(async (t) => {
        const url = await resolveAudioUrl(t);
        return url ? toAudioTrack(t, url) : null;
      })
    );
    const mapped = withUrls.filter(Boolean) as any[];
    if (!mapped.length) return;
    const start = mapped.findIndex((t) => t.id === track.id);
    setQueue(mapped, Math.max(0, start >= 0 ? start : Math.min(index, mapped.length - 1)), { type: "custom" });
    play();
  };

  return (
      <div className={clsx("flex flex-col gap-2 w-[180px]", variant === "compact" && "gap-1.5")}>
      <Link href={href || `/tracks/${track.id}`} className="block group focus:outline-none">
        <div
          className={clsx(
            "relative overflow-hidden bg-[var(--card)] h-[180px] w-full",
            "rounded-[12px] border border-[var(--border)] shadow-[var(--shadow-card)]",
            "transition-all duration-200 group-hover:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] group-hover:shadow-[0_0_0_0.5px_color-mix(in_srgb,var(--accent)_60%,transparent),0_8px_16px_rgba(0,0,0,0.14)]"
          )}
        >
          <Image
            src={track.coverUrl || placeholder}
            alt={track.title}
            fill
            className="object-cover"
            sizes="(min-width:1024px) 25vw, 60vw"
          />
          <button
            aria-label="Play track"
            onClick={handlePlay}
            className="absolute top-2 right-2 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          >
            <span className="rounded-full bg-black/60 backdrop-blur-sm border border-[color-mix(in_srgb,var(--accent)_80%,transparent)] p-2 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_90%,transparent)]">
              <Play weight="fill" size={18} color="var(--accent-strong)" />
            </span>
          </button>
          <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 via-black/30 to-transparent">
            <p className="text-xs text-white/80">Хочу такую же — для своего человека</p>
          </div>
          <span
            className="pointer-events-none absolute inset-0 opacity-0 group-focus-visible:opacity-100 group-active:opacity-100 transition-opacity"
            style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.12) inset" }}
          />
        </div>
      </Link>
      <div className="space-y-0.5 px-0.5">
        <h3 className="text-base font-semibold text-[var(--fg)] line-clamp-1">{track.title}</h3>
        <p className="text-sm text-[var(--fg)]/70 line-clamp-1">{track.artist || "Исполнитель"}</p>
        <p className="text-xs text-[var(--muted)]">Эта песня была подарком</p>
        <p className="text-xs text-[var(--fg)]/60 line-clamp-1">
          {track.genre || track.style || ""}
          {track.occasion ? ` • ${track.occasion}` : ""}
        </p>
      </div>
    </div>
  );
}
