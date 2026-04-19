"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  RepeatOnce,
  SpeakerHigh,
  SpeakerX,
  CaretDown,
  ShareNetwork,
  TelegramLogo,
  WhatsappLogo,
  LinkSimple
} from "@phosphor-icons/react";
import { Button } from "./Button";

export type PlayerControlsProps = {
  title?: string;
  artist?: string;
  coverUrl?: string;
  isPlaying: boolean;
  repeat: "off" | "all" | "one";
  onShare?: () => void;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  progress: number;
  duration: number;
  onSeek: (value: number) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  onCollapse?: () => void;
};

const formatTime = (value: number) => `${Math.floor(value / 60)}:${`${Math.floor(value % 60)}`.padStart(2, "0")}`;

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  title,
  artist,
  coverUrl,
  isPlaying,
  repeat,
  onPlayPause,
  onPrev,
  onNext,
  onToggleRepeat,
  onToggleShuffle,
  progress,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  onCollapse,
  onShare
}) => {
  const percentage = duration ? Math.min(100, (progress / duration) * 100) : 0;
  const repeatLabel = repeat === "one" ? "Повтор одного трека" : repeat === "all" ? "Повтор всех" : "Повтор выкл";
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const volumePct = Math.round((volume || 0) * 100);
  const toggleMute = () => onVolumeChange(volume > 0 ? 0 : 1);

  // управляемое вращение
  const coverKey = useMemo(() => `${coverUrl || ""}-${title || ""}-${artist || ""}`, [coverUrl, title, artist]);
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const lastSeekValRef = useRef(progress);
  const lastSeekTimeRef = useRef(performance.now());
  const closeVolumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeShareTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickAwayHandler = useRef<(e: MouseEvent) => void>();

  useEffect(() => {
    setRotation(0);
    lastSeekValRef.current = progress;
  }, [coverKey]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = () => {
      const now = performance.now();
      const delta = lastTsRef.current ? (now - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = now;
      const baseSpeed = 18; // deg/sec
      setRotation((r) => r + baseSpeed * delta);
      rafRef.current = requestAnimationFrame(tick);
    };
    lastTsRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const handleSeekChange = (value: number) => {
    const now = performance.now();
    const delta = value - lastSeekValRef.current;
    const dt = Math.max(1, now - lastSeekTimeRef.current);
    const velocity = delta / dt;
    const angularDelta = velocity * 5000;
    setRotation((r) => r + angularDelta);
    lastSeekValRef.current = value;
    lastSeekTimeRef.current = now;
    onSeek(value);
  };

  // popovers auto-hide and click-away
  useEffect(() => {
    const open = volumeOpen || shareOpen;
    if (open) {
      if (volumeOpen) {
        if (closeVolumeTimeout.current) clearTimeout(closeVolumeTimeout.current);
        closeVolumeTimeout.current = setTimeout(() => setVolumeOpen(false), 10000);
      }
      if (shareOpen) {
        if (closeShareTimeout.current) clearTimeout(closeShareTimeout.current);
        closeShareTimeout.current = setTimeout(() => setShareOpen(false), 10000);
      }
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        const insideVolume = target?.closest?.("[data-volume-popover]") || target?.closest?.("[data-volume-button]");
        const insideShare = target?.closest?.("[data-share-popover]") || target?.closest?.("[data-share-button]");
        if (!insideVolume) setVolumeOpen(false);
        if (!insideShare) setShareOpen(false);
      };
      clickAwayHandler.current = handler;
      document.addEventListener("mousedown", handler);
    }
    return () => {
      if (closeVolumeTimeout.current) clearTimeout(closeVolumeTimeout.current);
      if (closeShareTimeout.current) clearTimeout(closeShareTimeout.current);
      if (clickAwayHandler.current) document.removeEventListener("mousedown", clickAwayHandler.current);
    };
  }, [volumeOpen, shareOpen]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (e) {
      // ignore
    } finally {
      setShareOpen(false);
    }
  };

  const VolumeIcon = volume === 0 ? SpeakerX : SpeakerHigh;

  return (
    <motion.div
      key={coverKey}
      layout
      className="flex items-center gap-4 text-[var(--fg)] w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="relative h-16 w-16 rounded-full overflow-hidden bg-[var(--border)] border border-[var(--border-strong)]"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-[var(--muted)]">Нет обложки</div>
        )}
        <span className="absolute inset-0 border border-[color-mix(in_srgb,var(--bg)_45%,transparent)] rounded-full pointer-events-none" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-3 w-3 rounded-full bg-[color-mix(in_srgb,var(--bg)_70%,#000)] border border-[var(--border-strong)] shadow-inner" />
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-3 w-full pr-[20px]">
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--fg)]/50 mb-0.5">Сейчас играет</p>
            <p className="truncate text-sm text-[var(--fg)]/70">{artist || "Неизвестный исполнитель"}</p>
            <p className="truncate text-lg font-semibold text-[var(--fg)] leading-tight">{title || "Неизвестный трек"}</p>
          </div>

          <div className="flex-1 flex justify-center min-w-[260px] flex-shrink-0">
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <Button variant="ghost" onClick={onToggleShuffle} aria-label="Перемешать" className="focus:ring-0 h-12 w-12 p-0 border-none">
                <Shuffle weight="bold" size={32} className="transition-transform active:scale-90" />
              </Button>
              <Button variant="ghost" onClick={onPrev} aria-label="Предыдущий трек" className="focus:ring-0 h-12 w-12 p-0 border-none">
                <SkipBack weight="fill" size={32} className="transition-transform active:scale-90" />
              </Button>
              <Button onClick={onPlayPause} aria-label={isPlaying ? "Пауза" : "Играть"} className="focus:ring-0 h-12 w-12 p-0 border-none">
                {isPlaying ? <Pause weight="fill" size={32} className="transition-transform active:scale-90" /> : <Play weight="fill" size={32} className="transition-transform active:scale-90" />}
              </Button>
              <Button variant="ghost" onClick={onNext} aria-label="Следующий трек" className="focus:ring-0 h-12 w-12 p-0 border-none">
                <SkipForward weight="fill" size={32} className="transition-transform active:scale-90" />
              </Button>
              <Button variant="ghost" onClick={onToggleRepeat} aria-label={repeatLabel} className="focus:ring-0 h-12 w-12 p-0 border-none">
                {repeat === "one" ? <RepeatOnce weight="bold" size={32} /> : <Repeat weight={repeat === "all" ? "bold" : "regular"} size={32} />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center gap-1">
              <Button
                variant="ghost"
                data-volume-button
                onClick={() => setVolumeOpen((v) => !v)}
                aria-label={volume > 0 ? "Выключить звук" : "Включить звук"}
                className="focus:ring-0 h-12 w-12 p-0 border-none"
              >
                <VolumeIcon weight="fill" size={32} />
              </Button>
              <AnimatePresence>
                {volumeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 bg-[var(--glass)] backdrop-blur-[var(--blur-amount)] border border-[var(--border-strong)] rounded-[12px] px-2 py-2 shadow-[var(--shadow-card)] flex flex-col items-center gap-1.5"
                    style={{ width: "46px" }}
                    data-volume-popover
                  >
                    <div className="relative h-28 w-full flex items-center justify-center overflow-hidden">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={volumePct}
                        onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                        className="absolute appearance-none w-[130px] h-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--border-strong)] [&::-webkit-slider-thumb]:transition [&:hover::-webkit-slider-thumb]:scale-110"
                        style={{
                          background: `linear-gradient(to right, var(--accent) ${volumePct}%, color-mix(in srgb,var(--fg) 10%,transparent) ${volumePct}%)`,
                          borderRadius: "999px",
                          transform: "translate(-50%, -50%) rotate(-90deg)",
                          transformOrigin: "center",
                          left: "50%",
                          top: "50%"
                        }}
                      />
                    </div>
                    <button className="text-[10px] text-[var(--muted)] hover:text-[var(--fg)]" onClick={toggleMute}>
                      {volumePct}%
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex items-center">
              <Button
                variant="ghost"
                data-share-button
                onClick={() => {
                  setShareOpen((v) => !v);
                  onShare?.();
                }}
                aria-label="Поделиться"
                className="focus:ring-0 h-12 w-12 p-0 border-none"
              >
                <ShareNetwork weight="bold" size={24} />
              </Button>
              <AnimatePresence>
                {shareOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 bottom-full mb-3 bg-[var(--glass)] backdrop-blur-[var(--blur-amount)] border border-[var(--border-strong)] rounded-[14px] px-3 py-2 shadow-[var(--shadow-card)] flex flex-col gap-2 min-w-[170px]"
                    data-share-popover
                  >
                    <p className="text-[11px] text-[var(--fg)]/60">Поделиться треком</p>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        className="h-10 w-10 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[var(--fg)]/80 hover:text-[var(--fg)] hover:bg-white/5 transition"
                        onClick={() => window?.open?.(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`, "_blank")}
                        aria-label="Поделиться в Telegram"
                      >
                        <TelegramLogo size={18} weight="fill" />
                      </button>
                      <button
                        className="h-10 w-10 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[var(--fg)]/80 hover:text-[var(--fg)] hover:bg-white/5 transition"
                        onClick={() => window?.open?.(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, "_blank")}
                        aria-label="Поделиться в WhatsApp"
                      >
                        <WhatsappLogo size={18} weight="fill" />
                      </button>
                      <button
                        className="h-10 w-10 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[var(--fg)]/80 hover:text-[var(--fg)] hover:bg-white/5 transition"
                        onClick={() => window?.open?.(`https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}`, "_blank")}
                        aria-label="Поделиться в VK"
                      >
                        <span className="text-xs font-semibold">VK</span>
                      </button>
                      <button
                        className="h-10 w-10 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[var(--fg)]/80 hover:text-[var(--fg)] hover:bg-white/5 transition"
                        onClick={() => window?.open?.(`https://connect.ok.ru/offer?url=${encodeURIComponent(shareUrl)}`, "_blank")}
                        aria-label="Поделиться в Одноклассники"
                      >
                        <span className="text-xs font-semibold">OK</span>
                      </button>
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 text-[12px] text-[var(--fg)]/80 hover:text-[var(--fg)] hover:bg-white/5 rounded-lg px-2 py-1 transition"
                    >
                      <LinkSimple size={16} />
                      Скопировать ссылку
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {onCollapse && (
              <button
                aria-label="Свернуть плеер"
                onClick={onCollapse}
                className="h-8 w-8 rounded-full border border-[var(--border-strong)] text-[var(--fg)] hover:bg-white/5 transition flex items-center justify-center -mr-[5px]"
              >
                <CaretDown size={14} weight="bold" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full pr-[30px]">
          <input
            className="w-full h-[3px] rounded-full appearance-none focus:outline-none focus:ring-0 bg-[color-mix(in_srgb,var(--fg)_8%,transparent)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--border-strong)] [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[var(--border-strong)] [&::-ms-thumb]:appearance-none"
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            step="any"
            onChange={(e) => handleSeekChange(Number(e.target.value))}
            aria-label="Прокрутка трека"
            style={{
              background: `linear-gradient(90deg, var(--accent) ${percentage}%, color-mix(in srgb,var(--fg) 12%,transparent) ${percentage}%)`
            }}
          />
          <span className="text-xs text-[var(--muted)] w-12 text-right tabular-nums -ml-[5px]">{duration ? formatTime(progress) : "0:00"}</span>
        </div>
      </div>
    </motion.div>
  );
};
