"use client";

import { PlayerControls } from "@one-app/ui";
import { usePlayerStore } from "@one-app/player";
import { CtaButton } from "./CtaButton";
import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, CaretUp, CaretDown, DotsThree, Heart, Shuffle, Repeat, RepeatOnce } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export const PlayerBar = () => {
  const pathname = usePathname();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    next,
    prev,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    seek,
    volume,
    setVolume
  } = usePlayerStore();
  const [collapsed, setCollapsed] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [lyricsMode, setLyricsMode] = useState(false);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [manualLyricsScroll, setManualLyricsScroll] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const manualScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialViewportHeight = typeof window !== "undefined" ? window.innerHeight : 1200;
  const [sheetY, setSheetY] = useState(initialViewportHeight);
  const [sheetMetrics, setSheetMetrics] = useState<{ height: number; collapsedY: number; hiddenY: number }>({
    height: initialViewportHeight,
    collapsedY: 0,
    hiddenY: initialViewportHeight
  });
  const dragStartY = useRef(0);
  const dragStartSheetY = useRef(0);
  const isDraggingSheet = useRef(false);
  const lastMoveY = useRef(0);
  const lastMoveTime = useRef(0);
  const sheetAnimRef = useRef<number | null>(null);
  const sheetYRef = useRef(0);
  const sheetVelocityRef = useRef(0);
  const [shareLocked, setShareLocked] = useState(false);
  const shareLockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [coverRotation, setCoverRotation] = useState(0);
  const spinRafRef = useRef<number | null>(null);
  const lastSpinTsRef = useRef(0);
  const baseTimeRef = useRef(0);
  const startTsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [playerRevealed, setPlayerRevealed] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const entranceRaf = useRef<number | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [collapsedThumbVisible, setCollapsedThumbVisible] = useState(false);
  const scrubbingCollapsed = useRef(false);
  const lockedDirection = useRef<"horizontal" | "vertical" | null>(null);
  const scrubStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const dragStartedFromHeader = useRef(false);
  const playToggleFromTouch = useRef(false);

  const getViewportHeight = () => {
    if (typeof window === "undefined") return 0;
    if (window.visualViewport?.height) return window.visualViewport.height;
    return window.innerHeight;
  };

  const getSafeAreaBottom = () => {
    if (typeof window === "undefined") return 0;
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--safe-area-bottom");
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem("prosound_player_revealed");
    if (stored === "1") setPlayerRevealed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleReveal = () => {
      setPlayerRevealed(true);
      window.sessionStorage.setItem("prosound_player_revealed", "1");
    };
    window.addEventListener("prosound:player-reveal", handleReveal);
    return () => window.removeEventListener("prosound:player-reveal", handleReveal);
  }, []);

  useEffect(() => {
    if (isPlaying && currentTrack && !playerRevealed) {
      setPlayerRevealed(true);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("prosound_player_revealed", "1");
      }
    }
  }, [isPlaying, currentTrack, playerRevealed]);

  useEffect(() => {
    baseTimeRef.current = currentTime;
    startTsRef.current = performance.now();
    setDisplayProgress(currentTime);
  }, [currentTime]);

  useEffect(() => {
    if (!duration || !isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setDisplayProgress(baseTimeRef.current);
      return;
    }
    const tick = () => {
      const elapsed = (performance.now() - startTsRef.current) / 1000;
      const next = Math.min(duration, baseTimeRef.current + elapsed);
      setDisplayProgress(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, isPlaying]);

  useEffect(() => {
    if (!isMobile || !playerRevealed) return;
    if (!currentTrack) {
      setSheetVisible(false);
      setSheetY(sheetMetrics.hiddenY);
      return;
    }
    if (sheetVisible) return;
    if (entranceRaf.current) cancelAnimationFrame(entranceRaf.current);
    setSheetY(sheetMetrics.hiddenY);
    entranceRaf.current = requestAnimationFrame(() => {
      setSheetVisible(true);
      animateSheetTo(sheetMetrics.collapsedY);
    });
  }, [isMobile, playerRevealed, currentTrack, sheetVisible, sheetMetrics.hiddenY, sheetMetrics.collapsedY]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handle = () => setIsMobile(mq.matches);
    handle();
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  useEffect(() => {
    const calcMetrics = () => {
      const vh = getViewportHeight();
      const safeBottom = getSafeAreaBottom();
      const available = Math.max(0, vh - safeBottom);
      const height = available;
      const collapsedPeek = Math.max(72, Math.min(112, available * 0.2)); // keep ~20% of the sheet visible when collapsed
      const collapsedY = height > 0 ? Math.max(0, height - collapsedPeek) : 0;
      const hiddenY = height > 0 ? height + safeBottom + 32 : 0; // leave room for gesture bar / inertia
      setSheetMetrics({ height, collapsedY, hiddenY });
      if (!sheetVisible) {
        setSheetY(hiddenY);
      } else {
        setSheetY(mobileExpanded ? 0 : collapsedY);
      }
    };
    calcMetrics();
    window.addEventListener("resize", calcMetrics);
    return () => window.removeEventListener("resize", calcMetrics);
  }, [sheetVisible, mobileExpanded]);

  useEffect(() => {
    return () => {
      if (shareLockTimeout.current) clearTimeout(shareLockTimeout.current);
      if (entranceRaf.current) cancelAnimationFrame(entranceRaf.current);
      if (sheetAnimRef.current) cancelAnimationFrame(sheetAnimRef.current);
    };
  }, []);

  useEffect(() => {
    const lrcRaw = (currentTrack as any)?.lrc || (currentTrack as any)?.lyrics || "";
    if (!lrcRaw || typeof lrcRaw !== "string") {
      setLyrics([]);
      return;
    }
    const lines = lrcRaw.split("\n");
    const parsed: { time: number; text: string }[] = [];
    const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
    for (const line of lines) {
      const matches = [...line.matchAll(timeRegex)];
      if (!matches.length) continue;
      const text = line.replace(timeRegex, "").trim();
      for (const match of matches) {
        const m = Number(match[1]);
        const s = Number(match[2]);
        const ms = match[3] ? Number(match[3]) : 0;
        const total = m * 60 + s + ms / 1000;
        parsed.push({ time: total, text });
      }
    }
    parsed.sort((a, b) => a.time - b.time);
    setLyrics(parsed);
  }, [currentTrack]);

  useEffect(() => {
    setCoverRotation(0);
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!isPlaying) {
      if (spinRafRef.current) cancelAnimationFrame(spinRafRef.current);
      spinRafRef.current = null;
      lastSpinTsRef.current = 0;
      return;
    }
    const tick = () => {
      const now = performance.now();
      const delta = lastSpinTsRef.current ? (now - lastSpinTsRef.current) / 1000 : 0;
      lastSpinTsRef.current = now;
      const baseSpeed = 18; // deg/sec
      setCoverRotation((r) => r + baseSpeed * delta);
      spinRafRef.current = requestAnimationFrame(tick);
    };
    lastSpinTsRef.current = performance.now();
    spinRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (spinRafRef.current) cancelAnimationFrame(spinRafRef.current);
    };
  }, [isPlaying]);

  const stopSheetAnimation = () => {
    if (sheetAnimRef.current) cancelAnimationFrame(sheetAnimRef.current);
    sheetAnimRef.current = null;
  };

  const animateSheetTo = (target: number) => {
    stopSheetAnimation();
    sheetVelocityRef.current = 0;
    const targetY = Math.min(sheetMetrics.collapsedY, Math.max(0, target));
    let last = performance.now();
    const stiffness = 0.02;
    const damping = 0.1;
    const step = () => {
      const now = performance.now();
      const dt = Math.min(32, now - last);
      last = now;
      const current = sheetYRef.current;
      const delta = targetY - current;
      const accel = delta * stiffness;
      sheetVelocityRef.current = (sheetVelocityRef.current + accel * dt) * (1 - damping);
      let next = current + sheetVelocityRef.current * dt;
      next = Math.min(sheetMetrics.collapsedY, Math.max(0, next));
      setSheetY(next);
      const done = Math.abs(delta) < 0.4 && Math.abs(sheetVelocityRef.current) < 0.01;
      if (done) {
        setSheetY(targetY);
        sheetAnimRef.current = null;
        setMobileExpanded(targetY === 0);
        return;
      }
      sheetAnimRef.current = requestAnimationFrame(step);
    };
    sheetAnimRef.current = requestAnimationFrame(step);
  };

  const revealCollapsed = () => {
    setSheetY(sheetMetrics.hiddenY);
    setTimeout(() => {
      animateSheetTo(sheetMetrics.collapsedY);
    }, 200);
  };

  const lockShareFor = (ms: number) => {
    setShareLocked(true);
    if (shareLockTimeout.current) clearTimeout(shareLockTimeout.current);
    shareLockTimeout.current = setTimeout(() => setShareLocked(false), ms);
  };

  const expandSheet = () => {
    lockShareFor(600);
    animateSheetTo(0);
  };

  const collapseSheet = () => {
    animateSheetTo(sheetMetrics.collapsedY);
  };

  const startDragSheet = (y: number) => {
    const rect = sheetRef.current?.getBoundingClientRect();
    const fromTop = rect ? y - rect.top : 0;
    const headerZone = 140; // widen grab area to make swipe down reliable on mobile
    dragStartedFromHeader.current = fromTop <= headerZone || !mobileExpanded;
    stopSheetAnimation();
    isDraggingSheet.current = true;
    dragStartY.current = y;
    dragStartSheetY.current = sheetY;
    lastMoveY.current = y;
    lastMoveTime.current = performance.now();
    dragDistanceRef.current = 0;
  };

  const moveDragSheet = (y: number) => {
    if (!isDraggingSheet.current) return;
    const delta = y - dragStartY.current;
    dragDistanceRef.current = delta;
    const next = Math.min(sheetMetrics.collapsedY, Math.max(0, dragStartSheetY.current + delta));
    setSheetY(next);
    const now = performance.now();
    lastMoveY.current = y;
    lastMoveTime.current = now;
  };

  const endDragSheet = (y: number) => {
    if (!isDraggingSheet.current) return;
    if (mobileExpanded && !dragStartedFromHeader.current) {
      isDraggingSheet.current = false;
      return animateSheetTo(0); // ignore stray drags from content
    }
    const dt = Math.max(1, performance.now() - lastMoveTime.current);
    const dy = y - lastMoveY.current;
    const velocity = dy / dt; // px per ms, sign reflects direction
    isDraggingSheet.current = false;
    const distance = dragDistanceRef.current;
    const minDistance = 24;
    const velocityThreshold = 0.35;
    const collapseDistanceThreshold = Math.max(96, Math.min(sheetMetrics.collapsedY * 0.3, 180)); // clamp to sensible range
    const shouldCollapse = distance > collapseDistanceThreshold || (velocity > velocityThreshold && distance > minDistance);
    const target = shouldCollapse ? sheetMetrics.collapsedY : 0;
    animateSheetTo(target);
  };

  useEffect(() => {
    const lockScroll = sheetY < sheetMetrics.collapsedY - 1 || isDraggingSheet.current;
    const prev = document.body.style.overflow;
    if (lockScroll) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetY, sheetMetrics.collapsedY]);

  const progressPercent = duration ? Math.min(100, (displayProgress / duration) * 100) : 0;
  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return "0:00";
    const total = Math.max(0, Math.floor(value));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };
  const activeLyricIndex = lyrics.findIndex((item, idx) => {
    const next = lyrics[idx + 1];
    return displayProgress >= item.time && (!next || displayProgress < next.time);
  });

  const isInteractiveTarget = (target: EventTarget | null) => {
    const node = target as HTMLElement | null;
    if (!node) return false;
    if (node.closest && node.closest("button, a, input, select, textarea, option")) return true;
    let el = node;
    while (el) {
      const tag = el.tagName?.toLowerCase();
      if (["button", "input", "select", "textarea", "option", "a"].includes(tag)) return true;
      if (barRef.current && barRef.current.contains(el)) return true;
      el = el.parentElement;
    }
    return false;
  };

  useEffect(() => {
    sheetYRef.current = sheetY;
  }, [sheetY]);

  useEffect(() => {
    if (activeLyricIndex < 0 || manualLyricsScroll) return;
    const node = lyricsContainerRef.current?.querySelector(`[data-lyric-idx="${activeLyricIndex}"]`) as HTMLDivElement | null;
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeLyricIndex, manualLyricsScroll]);

  const handleLyricsScroll = () => {
    setManualLyricsScroll(true);
    if (manualScrollTimeout.current) clearTimeout(manualScrollTimeout.current);
    manualScrollTimeout.current = setTimeout(() => setManualLyricsScroll(false), 2000);
  };

  if (!playerRevealed) {
    return null;
  }

  if (!currentTrack && !collapsed) {
    return (
      <div className="fixed inset-x-0 bottom-3 px-3 md:px-6 flex justify-center pointer-events-none z-30">
        <div className="max-w-5xl w-full rounded-full p-4 text-[var(--muted)] text-sm bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)] pointer-events-auto">
          Выберите трек или плейлист — плеер останется с вами, пока слушаете истории.
        </div>
      </div>
    );
  }

  const toggleShuffle = () => setShuffle(!shuffle);
  const toggleRepeat = () => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off");
  const handleShare = () => {
    if (!currentTrack) return;
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/tracks/${currentTrack.id || ""}`
        : `/tracks/${currentTrack.id || ""}`;
    if (navigator.share) {
      navigator.share({ title: currentTrack.title, text: "Поделиться этим чувством", url: shareUrl }).catch(() => undefined);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => undefined);
    }
  };
  const nearEnd = duration > 0 && currentTime / duration >= 0.9;
  const handlePlayToggle = () => {
    isPlaying ? pause() : play();
  };

  const handleSeek = (value: number) => {
    baseTimeRef.current = value;
    startTsRef.current = performance.now();
    setDisplayProgress(value);
    if (duration) {
      setCoverRotation((value / duration) * 360);
    }
    seek(value);
  };

  if (isMobile) {
    if (!currentTrack) return null;

    const renderSheetY = Math.min(sheetMetrics.hiddenY || sheetY, Math.max(0, sheetY));
    const expandProgress = Math.min(1, Math.max(0, 1 - renderSheetY / Math.max(1, sheetMetrics.collapsedY || 1)));
    const collapsedOpacity = 1 - expandProgress;
    const expandedOpacity = expandProgress;
    const overlayOpacity = expandedOpacity * 0.55;
    const collapsedVisibility = collapsedOpacity > 0.02 ? "visible" : "hidden";

    const handleScrub = (clientX: number) => {
      if (!duration) return;
      const el = barRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const nextTime = duration * ratio;
      baseTimeRef.current = nextTime;
      startTsRef.current = performance.now();
      setDisplayProgress(nextTime);
      setCoverRotation(ratio * 360);
      seek(nextTime);
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!duration) return;
      scrubbingCollapsed.current = true;
      lockedDirection.current = null;
      scrubStart.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleScrub(e.clientX);
      setCollapsedThumbVisible(true);
      e.preventDefault();
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbingCollapsed.current) return;
      if (!lockedDirection.current) {
        const dx = Math.abs(e.clientX - scrubStart.current.x);
        const dy = Math.abs(e.clientY - scrubStart.current.y);
        if (dx > 6 || dy > 6) {
          lockedDirection.current = dx >= dy ? "horizontal" : "vertical";
        }
      }
      if (lockedDirection.current === "horizontal") {
        handleScrub(e.clientX);
        e.preventDefault();
      }
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbingCollapsed.current) return;
      scrubbingCollapsed.current = false;
      lockedDirection.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setCollapsedThumbVisible(false);
      e.preventDefault();
    };

    const headerTitle = currentTrack.artist || "Сейчас играет";
    const handlePlayTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      playToggleFromTouch.current = true;
      handlePlayToggle();
    };
    const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (playToggleFromTouch.current) {
        playToggleFromTouch.current = false;
        return;
      }
      handlePlayToggle();
    };

    return (
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div
          className="absolute inset-0 bg-black/60 pointer-events-auto"
          style={{ opacity: overlayOpacity, pointerEvents: expandedOpacity > 0 ? "auto" : "none" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-auto rounded-t-3xl bg-[var(--glass)] border border-[var(--border-strong)] shadow-[0_-10px_28px_rgba(0,0,0,0.35)] overflow-hidden relative"
          style={{
            transform: `translateY(${renderSheetY}px)`,
            height: sheetMetrics.height ? `${sheetMetrics.height}px` : "100svh",
            minHeight: "min(100svh, 100dvh)",
            maxHeight: "100dvh",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
            opacity: sheetVisible ? 1 : 0,
            transition: isDraggingSheet.current ? "none" : "transform 320ms ease, opacity 240ms ease",
            pointerEvents: sheetVisible ? "auto" : "none",
            willChange: "transform"
          }}
          ref={sheetRef}
          onTouchStart={(e) => {
            if (isInteractiveTarget(e.target)) return;
            // Allow vertical swipe only from header/grab area to avoid conflicts with scrollable content
            startDragSheet(e.touches[0].clientY);
            e.preventDefault();
          }}
          onTouchMove={(e) => {
            if (!isDraggingSheet.current) return;
            moveDragSheet(e.touches[0].clientY);
            e.preventDefault();
          }}
          onTouchEnd={(e) => {
            if (!isDraggingSheet.current) return;
            endDragSheet(e.changedTouches[0].clientY);
            e.preventDefault();
          }}
          onPointerDown={(e) => {
            // allow mouse drag in dev/desktop emulation
            if (e.pointerType === "mouse") return;
            if (isInteractiveTarget(e.target)) return;
            // Allow vertical swipe only from header/grab area to avoid conflicts with scrollable content
            startDragSheet(e.clientY);
            e.preventDefault();
          }}
          onPointerMove={(e) => {
            if (!isDraggingSheet.current || e.pointerType === "mouse") return;
            moveDragSheet(e.clientY);
            e.preventDefault();
          }}
          onPointerUp={(e) => {
            if (!isDraggingSheet.current || e.pointerType === "mouse") return;
            endDragSheet(e.clientY);
            e.preventDefault();
          }}
        >
          <div className="absolute inset-0 -z-10 bg-[var(--glass)]/92 backdrop-blur-xl" />
          {/* Collapsed content */}
          <div
            className="flex flex-col items-center px-5 pt-4 pb-8 gap-3 absolute inset-x-0 top-0"
            style={{
              opacity: collapsedOpacity,
              pointerEvents: collapsedOpacity > 0 ? "auto" : "none",
              transform: `translateY(${expandProgress * 12}px)`,
              transition: "opacity 180ms ease, transform 220ms ease",
              visibility: collapsedVisibility,
              willChange: "opacity, transform"
            }}
          >
            <div className="w-12 h-1.5 rounded-full bg-white/25" />
            <div className="flex items-center gap-3 w-full">
              <div
                className="relative h-[64px] w-[64px] rounded-full overflow-visible bg-[var(--border)] border border-[var(--border-strong)] shadow-[var(--shadow-card)] flex-shrink-0"
                style={{ transform: `rotate(${coverRotation}deg)`, transition: "transform 200ms linear" }}
              >
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] text-[var(--muted)]">Нет обложки</div>
                )}
                <span className="absolute inset-0 border border-[color-mix(in_srgb,var(--bg)_45%,transparent)] rounded-full pointer-events-none" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-4 w-4 rounded-full bg-[color-mix(in_srgb,var(--bg)_70%,#000)] border border-[var(--border-strong)] shadow-inner" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="relative h-[18px] overflow-hidden">
                  <div className="absolute inset-0">
                    <p className="text-sm font-semibold text-[var(--fg)] truncate">{currentTrack.title}</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--muted)] truncate">{currentTrack.artist}</p>
                <div
                  ref={barRef}
                  className="relative mt-2 h-[2px] rounded-full bg-[color-mix(in_srgb,var(--fg)_10%,transparent)] overflow-visible transition-opacity duration-200"
                  style={{ opacity: duration ? 1 : 0 }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onPointerEnter={() => setCollapsedThumbVisible(true)}
                  onPointerLeave={() => {
                    if (!scrubbingCollapsed.current) setCollapsedThumbVisible(false);
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[10px] cursor-pointer"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    onPointerEnter={() => setCollapsedThumbVisible(true)}
                    onPointerLeave={() => {
                      if (!scrubbingCollapsed.current) setCollapsedThumbVisible(false);
                    }}
                  />
                  <div className="h-full bg-[var(--accent)]" style={{ width: `${progressPercent}%`, transition: scrubbingCollapsed.current ? "none" : "width 120ms linear" }} />
                  <div
                    className="absolute top-1/2 h-3 w-3 rounded-full bg-[var(--accent)] border border-[var(--border-strong)] shadow-[var(--shadow-card)] transition-opacity duration-120 pointer-events-none"
                    style={{
                      left: `${progressPercent}%`,
                      transform: "translate(-50%, -50%)",
                      opacity: collapsedThumbVisible ? 1 : 0
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="h-11 w-11 rounded-full bg-[color-mix(in srgb,var(--bg) 55%,transparent)] border border-[var(--border)] flex items-center justify-center active:scale-95 transition"
                  onTouchEnd={handlePlayTouchEnd}
                  onClick={handlePlayClick}
                  aria-label={isPlaying ? "Пауза" : "Играть"}
                  type="button"
                >
                  {isPlaying ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
                </button>
                <button
                  className="h-10 w-9 flex items-center justify-center text-[var(--muted)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    animateSheetTo(0);
                  }}
                  aria-label="Развернуть"
                  type="button"
                >
                  <CaretUp size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded content (same surface) */}
          <div
            className="flex flex-col h-full px-5 pt-4 pb-6 gap-4"
            style={{
              opacity: expandedOpacity,
              pointerEvents: expandedOpacity > 0 ? "auto" : "none",
              transform: `translateY(${(1 - expandedOpacity) * 16}px)`,
              transition: "opacity 220ms ease, transform 240ms ease",
              position: "relative",
              zIndex: expandedOpacity > 0 ? 1 : 0,
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full text-[var(--fg)]/70">
              <div className="h-10 w-10" aria-hidden="true" />
              <div className="text-[11px] font-semibold tracking-[0.28em] uppercase max-w-[62%] truncate text-center text-[var(--fg)]/60">
                {headerTitle}
              </div>
              <button
                className="h-10 w-10 rounded-full border border-[var(--border)] bg-white/5 flex items-center justify-center active:scale-95 transition disabled:opacity-60"
                onClick={(e) => {
                  e.stopPropagation();
                  collapseSheet();
                }}
                aria-label="Свернуть"
                type="button"
              >
                <CaretDown size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-5 w-full flex-1 min-h-0">
              <div
                className="relative w-[72vw] h-[72vw] max-w-[320px] max-h-[320px] rounded-[26px] overflow-hidden shadow-[var(--shadow-card)]"
                style={{ transition: "transform 240ms ease", maxHeight: "min(52svh, 320px)" }}
              >
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[var(--muted)]">Нет обложки</div>
                )}
              </div>
              <div className="w-full flex items-start justify-between px-2 gap-3">
                <div className="min-w-0">
                  <p className="text-2xl font-semibold truncate">{currentTrack.title}</p>
                  <p className="text-sm text-[var(--fg)]/70 truncate">{currentTrack.artist || "Неизвестный артист"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="h-10 w-10 rounded-full border border-[var(--border)] bg-white/5 flex items-center justify-center text-[var(--fg)]/70"
                    type="button"
                    aria-label="В избранное"
                  >
                    <Heart size={18} weight="regular" />
                  </button>
                  <button
                    className="h-10 w-10 rounded-full border border-[var(--border)] bg-white/5 flex items-center justify-center active:scale-95 transition disabled:opacity-60"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!shareLocked) handleShare();
                    }}
                    aria-label="Поделиться"
                    type="button"
                    disabled={shareLocked}
                  >
                    <DotsThree size={18} weight="bold" />
                  </button>
                </div>
              </div>
              <div className="w-full px-1 flex-shrink-0">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={displayProgress}
                  step="any"
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  onMouseDown={() => setIsScrubbing(true)}
                  onMouseUp={() => setIsScrubbing(false)}
                  onTouchStart={() => setIsScrubbing(true)}
                  onTouchEnd={() => setIsScrubbing(false)}
                  className="w-full h-[2px] rounded-full appearance-none bg-[color-mix(in_srgb,var(--fg)_14%,transparent)] focus:outline-none focus:ring-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--fg)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--border-strong)]"
                  style={{
                    background: `linear-gradient(90deg, var(--fg) ${progressPercent}%, color-mix(in srgb,var(--fg) 16%,transparent) ${progressPercent}%)`
                  }}
                />
                <div className="flex items-center justify-between text-[11px] text-[var(--muted)] mt-2">
                  <span>{formatTime(displayProgress)}</span>
                  <span>-{formatTime(Math.max(0, duration - displayProgress))}</span>
                </div>
              </div>
              <div className="w-full flex items-center justify-between px-2 text-[var(--muted)] flex-shrink-0">
                <button
                  className={`h-10 w-10 rounded-full border border-[var(--border)] flex items-center justify-center transition ${shuffle ? "bg-[color-mix(in_srgb,var(--fg)_18%,transparent)] text-[var(--fg)]" : "bg-white/5"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShuffle(!shuffle);
                  }}
                  aria-label="Перемешать"
                  type="button"
                >
                  <Shuffle size={18} weight="bold" />
                </button>
                <button
                  className="h-11 w-11 rounded-full border border-[var(--border)] bg-white/5 flex items-center justify-center active:scale-95 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  aria-label="Предыдущий трек"
                  type="button"
                >
                  <SkipBack size={22} weight="fill" />
                </button>
                <button
                  className="h-14 w-14 rounded-full bg-[var(--fg)] text-[var(--bg)] flex items-center justify-center active:scale-95 transition shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
                  onTouchEnd={handlePlayTouchEnd}
                  onClick={handlePlayClick}
                  aria-label={isPlaying ? "Пауза" : "Играть"}
                  type="button"
                >
                  {isPlaying ? <Pause size={26} weight="fill" /> : <Play size={26} weight="fill" />}
                </button>
                <button
                  className="h-11 w-11 rounded-full border border-[var(--border)] bg-white/5 flex items-center justify-center active:scale-95 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  aria-label="Следующий трек"
                  type="button"
                >
                  <SkipForward size={22} weight="fill" />
                </button>
                <button
                  className={`h-10 w-10 rounded-full border border-[var(--border)] flex items-center justify-center transition ${repeat !== "off" ? "bg-[color-mix(in_srgb,var(--fg)_18%,transparent)] text-[var(--fg)]" : "bg-white/5"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRepeat();
                  }}
                  aria-label="Повтор"
                  type="button"
                >
                  {repeat === "one" ? <RepeatOnce size={18} weight="bold" /> : <Repeat size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {collapsed ? (
        <motion.div
          key="player-collapsed"
          className="fixed bottom-[14px] right-4 z-40 pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.8, 0.4, 1] } }}
          exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
        >
          <div className="pointer-events-auto border border-[var(--border-strong)] bg-[var(--glass)] backdrop-blur-xl shadow-[var(--shadow)] rounded-2xl px-3 py-2 flex items-center gap-3 w-[364px]">
            <div className="h-8 w-8 rounded-lg overflow-hidden bg-[var(--border)]">
              {currentTrack?.coverUrl ? (
                <img src={currentTrack.coverUrl} alt={currentTrack?.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] text-[var(--muted)]">Нет обложки</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[var(--muted)]">Сейчас играет</p>
              <p className="text-sm font-semibold truncate">{currentTrack?.title}</p>
              <p className="text-xs text-[var(--muted)] truncate">{currentTrack?.artist}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="h-9 w-9 rounded-full bg-[color-mix(in srgb,var(--bg) 60%,transparent)] border border-[var(--border)] flex items-center justify-center active:scale-90 transition"
                aria-label={isPlaying ? "Пауза" : "Играть"}
                onClick={isPlaying ? pause : play}
              >
                {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
              </button>
              <button
                className="h-9 w-9 rounded-full bg-[color-mix(in srgb,var(--bg) 60%,transparent)] border border-[var(--border)] flex items-center justify-center active:scale-90 transition"
                aria-label="Следующий трек"
                onClick={next}
              >
                <SkipForward size={18} weight="bold" />
              </button>
            </div>
            <button
              className="text-xs text-[var(--muted)] underline decoration-[var(--muted)]/60 hover:text-[var(--fg)] transition"
              onClick={() => setCollapsed(false)}
              aria-label="Развернуть плеер"
            >
              Развернуть
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="player-expanded"
          className="fixed inset-x-0 bottom-[14px] px-4 md:px-8 lg:px-12 pointer-events-none z-30 flex flex-col items-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.8, 0.4, 1] } }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
        >
          <div className="w-full border border-[var(--border-strong)] bg-[var(--glass)] backdrop-blur-xl py-1.5 px-4 shadow-[var(--shadow)] pointer-events-auto rounded-full">
            {currentTrack && (
              <PlayerControls
                title={currentTrack.title}
                artist={currentTrack.artist}
                coverUrl={currentTrack.coverUrl}
                isPlaying={isPlaying}
                repeat={repeat}
                onShare={handleShare}
                onPlayPause={() => (isPlaying ? pause() : play())}
                onPrev={prev}
                onNext={next}
                onToggleShuffle={toggleShuffle}
                onToggleRepeat={toggleRepeat}
                progress={displayProgress}
                duration={duration}
                onSeek={handleSeek}
                volume={volume}
                onVolumeChange={setVolume}
                onCollapse={() => setCollapsed(true)}
              />
            )}
          </div>
          {nearEnd && (
            <div className="px-4 py-3 rounded-full bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--fg)]/80 flex items-center gap-3 pointer-events-auto shadow-[var(--shadow-card)] max-w-6xl w-full">
              <span>Что бы вы хотели сказать?</span>
              <CtaButton href="/order" size="sm">
                Сказать это музыкой
              </CtaButton>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
