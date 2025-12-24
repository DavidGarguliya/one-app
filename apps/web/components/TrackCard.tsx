"use client";
import Link from "next/link";
import Image from "next/image";
import clsx from "classnames";
import { TrackDTO } from "@one-app/types";
import { Play } from "@phosphor-icons/react";
import { fetchLatestTracks } from "../lib/api";
import { usePlayerStore } from "@one-app/player";
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
    const latest = await fetchLatestTracks(50).catch(() => []);
    const baseList = latest.length ? latest : queue && queue.length ? queue : [track];
    const mapped = baseList.map((t) => ({
      id: t.id,
      url: (t as any).audioUrl || (t as any).url,
      title: t.title,
      artist: t.artist || "",
      coverUrl: t.coverUrl
    })) as any[];
    const start = mapped.findIndex((t) => t.id === track.id);
    setQueue(mapped, Math.max(0, start >= 0 ? start : Math.min(index, mapped.length - 1)));
    play();
  };

  return (
      <div className={clsx("flex flex-col gap-2 w-[180px]", variant === "compact" && "gap-1.5")}>
      <Link href={href || `/tracks/${track.id}`} className="block group focus:outline-none">
        <div
          className={clsx(
            "relative overflow-hidden bg-[var(--card)] h-[180px] w-full",
            "rounded-[12px] border border-[var(--border)] shadow-[var(--shadow-card)]",
            "transition-colors duration-200 group-hover:border-[var(--accent)] group-hover:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_70%,transparent),0_16px_32px_rgba(0,0,0,0.2)]"
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
