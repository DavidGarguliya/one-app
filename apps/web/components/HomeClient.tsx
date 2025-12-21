"use client";

import { useEffect, useRef, useState } from "react";
import { TrackDTO } from "@one-app/types";
import { usePlayerStore } from "@one-app/player";
import { motion, AnimatePresence } from "framer-motion";
import { CtaButton } from "./CtaButton";

type Scene = {
  key: string;
  content: React.ReactNode;
};

export function HomeClient({ featured }: { featured: TrackDTO }) {
  const { setQueue, play, pause, currentTrack } = usePlayerStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [active, setActive] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealOnPlay = useRef(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const recognitionTimer = useRef<number | null>(null);
  const [recognitionPlayed, setRecognitionPlayed] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!featured) return;
    if (!currentTrack || currentTrack.id !== featured.id) {
      setQueue(
        [
          {
            id: featured.id,
            url: (featured as any).audioUrl || (featured as any).url,
            title: featured.title,
            artist: featured.artist || "",
            coverUrl: featured.coverUrl
          } as any
        ],
        0
      );
      pause();
      setIsPlaying(false);
    }
  }, [featured, currentTrack, setQueue, pause]);

  const togglePlay = () => {
    if (!featured) return;
    if (!revealOnPlay.current && typeof window !== "undefined") {
      window.sessionStorage.setItem("prosound_player_revealed", "1");
      window.dispatchEvent(new Event("prosound:player-reveal"));
      revealOnPlay.current = true;
    }
    if (!currentTrack || currentTrack.id !== featured.id) {
      setQueue(
        [
          {
            id: featured.id,
            url: (featured as any).audioUrl || (featured as any).url,
            title: featured.title,
            artist: featured.artist || "",
            coverUrl: featured.coverUrl
          } as any
        ],
        0
      );
      play();
      setIsPlaying(true);
      return;
    }
    if (isPlaying) {
      pause();
      setIsPlaying(false);
    } else {
      play();
      setIsPlaying(true);
    }
  };

  const recognition = [
    "Когда слова застревают внутри",
    "Когда человек далеко",
    "Когда нужно попросить прощения",
    "Когда хочется оставить что-то ребёнку",
    "Когда важно сохранить память",
    "Когда начинается новая глава"
  ];
  const recognitionIndex = 1;

  const scenes: Scene[] = [
    {
      key: "hero",
      content: (
        <div className="min-h-screen flex flex-col justify-center px-6 md:px-10 lg:px-16 bg-[color-mix(in_srgb,var(--bg)_95%,#0c0f12)]">
          <div className="space-y-6 max-w-[520px] w-full mx-auto">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-[var(--fg)]">
              {`Если у чувства есть история —\nу неё должен быть звук.`}
            </h1>
            <p className="text-lg text-[var(--fg)]/70 leading-relaxed">
              ProSound — студия персональных аудио-историй
              <br />
              для людей и моментов, которые невозможно выразить словами.
            </p>
          </div>
        </div>
      )
    },
    {
      key: "recognition",
      content: (
        <div className="min-h-screen flex flex-col justify-center px-6 md:px-10 lg:px-16 bg-[color-mix(in_srgb,var(--bg)_92%,#0d1014)]">
          <div className="relative h-[240px] max-w-[520px] w-full mx-auto translate-y-[140px]">
            {recognition.map((line, idx) => {
              const isVisible = idx < visibleLines;
              const offset = visibleLines - idx - 1;
              return (
                <p
                  key={line}
                  className={`absolute left-0 right-0 text-left text-xl md:text-2xl text-[var(--fg)]/80 leading-relaxed transition-all duration-700 ease-out ${
                    isVisible ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    transform: `translateY(${isVisible ? -offset * 44 : 16}px)`
                  }}
                >
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      )
    },
    {
      key: "audio",
      content: (
        <div className="min-h-screen flex flex-col justify-center px-6 md:px-10 lg:px-16 bg-[color-mix(in_srgb,var(--bg)_90%,#0c0f12)] space-y-4">
          <div className="space-y-2 max-w-[520px] w-full mx-auto">
            <p className="text-lg text-[var(--fg)]/70 leading-relaxed">
              {`Иногда музыку создают не для всех.\nИногда — для одного человека.`}
            </p>
            <p className="text-sm text-[var(--muted)]">Пример персональной аудио-истории</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-5 py-4 shadow-[var(--shadow-card)] max-w-[520px] w-full mx-auto">
            <button
              onClick={togglePlay}
              className="h-12 w-12 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg)_50%,transparent)] flex items-center justify-center text-[var(--fg)] text-lg"
              aria-label={isPlaying ? "Пауза" : "Проиграть"}
            >
              {isPlaying ? "❚❚" : "►"}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium truncate">{featured?.title || "Персональный трек"}</p>
              <p className="text-sm text-[var(--fg)]/60 truncate">{featured?.artist || "История, рассказанная музыкой"}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "context",
      content: (
        <div className="min-h-screen flex flex-col justify-center px-6 md:px-10 lg:px-16 bg-[color-mix(in_srgb,var(--bg)_92%,#101317)]">
          <div className="space-y-3 max-w-[520px] w-full mx-auto">
            <p className="text-lg text-[var(--fg)]/80 leading-relaxed">
              Этот трек был создан как личное послание.
              <br />
              У него был один адресат и одна история.
              <br />
              Именно так в ProSound рождается музыка.
            </p>
            <a href="#story" className="text-sm text-[var(--fg)]/70 underline underline-offset-4 hover:text-[var(--fg)]">
              А если история — про вас?
            </a>
          </div>
        </div>
      )
    },
    {
      key: "process",
      content: (
        <div className="min-h-screen flex flex-col justify-center px-6 md:px-10 lg:px-16 bg-[color-mix(in_srgb,var(--bg)_90%,#0d1115)]">
          <div className="space-y-3 max-w-[520px] w-full mx-auto">
            <p className="text-lg text-[var(--fg)]/80 leading-relaxed">
              Вы рассказываете историю — как можете.
              <br />
              Мы превращаем её в музыку.
              <br />
              Вы получаете персональный трек,
              <br />
              оформленный как память и подарок.
            </p>
          </div>
        </div>
      )
    },
    {
      key: "cta",
      content: (
        <div id="story" className="min-h-screen flex flex-col justify-center px-6 md:px-10 lg:px-16 bg-[color-mix(in_srgb,var(--bg)_88%,#0c0f12)]">
          <div className="space-y-4 max-w-[520px] w-full mx-auto">
            <p className="text-xl md:text-2xl text-[var(--fg)]/85 leading-relaxed">Иногда достаточно одного трека, чтобы сказать важное.</p>
            <CtaButton href="/order" full>
              Рассказать свою историю
            </CtaButton>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const played = window.sessionStorage.getItem("prosound_recognition_played") === "1";
    setRecognitionPlayed(played);
  }, []);

  useEffect(() => {
    if (!recognitionPlayed) return;
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("prosound_recognition_played", "1");
  }, [recognitionPlayed]);

  useEffect(() => {
    if (active !== recognitionIndex) {
      setVisibleLines(0);
      if (recognitionTimer.current) {
        window.clearInterval(recognitionTimer.current);
        recognitionTimer.current = null;
      }
      return;
    }
    if (recognitionPlayed) {
      setVisibleLines(recognition.length);
      return;
    }
    setVisibleLines(1);
    if (recognitionTimer.current) window.clearInterval(recognitionTimer.current);
    let step = 1;
    recognitionTimer.current = window.setInterval(() => {
      setVisibleLines((count) => {
        if (count >= recognition.length) {
          if (recognitionTimer.current) {
            window.clearInterval(recognitionTimer.current);
            recognitionTimer.current = null;
          }
          setRecognitionPlayed(true);
          return count;
        }
        return count + 1;
      });
      step += 1;
      if (step === 2 && recognitionTimer.current) {
        window.clearInterval(recognitionTimer.current);
        recognitionTimer.current = window.setInterval(() => {
          setVisibleLines((count) => {
            if (count >= recognition.length) {
              if (recognitionTimer.current) {
                window.clearInterval(recognitionTimer.current);
                recognitionTimer.current = null;
              }
              setRecognitionPlayed(true);
              return count;
            }
            return count + 1;
          });
        }, 1000);
      }
    }, 2000);
    return () => {
      if (recognitionTimer.current) {
        window.clearInterval(recognitionTimer.current);
        recognitionTimer.current = null;
      }
    };
  }, [active, recognition.length, recognitionPlayed]);

  const goTo = (next: number) => {
    if (isTransitioning) return;
    if (next < 0 || next >= scenes.length) return;
    setIsTransitioning(true);
    setActive(next);
    transitionTimeout.current = setTimeout(() => setIsTransitioning(false), 650);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (isTransitioning) return;
    if (Math.abs(e.deltaY) < 20) return;
    if (e.deltaY > 0) goTo(active + 1);
    else goTo(active - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (Math.abs(delta) < 35 || isTransitioning) return;
    if (delta < 0) goTo(active + 1);
    else goTo(active - 1);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden -translate-y-[225px]" onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20 pointer-events-auto">
        {scenes.map((scene, idx) => (
          <button
            key={scene.key}
            type="button"
            onClick={() => goTo(idx)}
            aria-label={`Сцена ${idx + 1}`}
            aria-current={idx === active ? "true" : "false"}
            className={`h-2.5 w-2.5 rounded-full border border-[var(--border-strong)] transition-all duration-300 ease-out ${
              idx === active ? "bg-[var(--accent)] scale-110 shadow-[0_0_0_4px_rgba(255,255,255,0.08)]" : "bg-transparent"
            }`}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={scenes[active]?.key}
          className="absolute inset-0"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.8, 0.4, 1] } }}
          exit={{ opacity: 0, y: -30, transition: { duration: 0.55, ease: [0.4, 0.0, 0.2, 1] } }}
        >
          <div className="h-full translate-y-[200px]">{scenes[active]?.content}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
