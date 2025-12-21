"use client";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@one-app/ui";
import { PlaylistDTO, TrackDTO } from "@one-app/types";
import { PlayPlaylistButton } from "./PlayPlaylistButton";

export default function PlaylistView({ playlist, tracks }: { playlist: PlaylistDTO; tracks: TrackDTO[] }) {
  return (
    <main className="px-4 pb-24 pt-10 md:px-8 lg:px-12 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Плейлист</p>
          <h1 className="text-3xl font-semibold">{playlist.title}</h1>
          <p className="text-white/70">{playlist.description}</p>
        </div>
        <PlayPlaylistButton playlist={playlist} />
      </div>
      <div className="space-y-2">
        {tracks.map((track) => (
          <Link key={track.id} href={`/tracks/${track.id}`} className="group">
            <Card className="flex items-center gap-3 shadow-[0_12px_26px_rgba(0,0,0,0.14)] group-hover:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_70%,transparent),0_14px_28px_rgba(0,0,0,0.2)]">
              <div className="relative h-10 w-10 rounded-xl bg-white/10 overflow-hidden">
                <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="40px" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{track.title}</p>
                <p className="text-sm text-white/60">{track.artist}</p>
              </div>
              <span className="text-sm text-white/60">
                {track.duration ? `${Math.floor(track.duration / 60)}:${`${Math.floor(track.duration % 60)}`.padStart(2, "0")}` : "—"}
              </span>
              <div className="ml-2 rounded-full bg-black/60 border border-[color-mix(in_srgb,var(--accent)_80%,transparent)] p-2 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_90%,transparent)]">
                <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-[var(--accent-strong)]">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
        {!tracks.length && <p className="text-sm text-white/60">В этом плейлисте пока нет треков.</p>}
      </div>
    </main>
  );
}
