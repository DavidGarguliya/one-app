"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@one-app/player";

const DURATION = 500;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = () => setReduced(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useThemeAttr() {
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => {
    const doc = document.documentElement;
    const update = () => setTheme(doc.getAttribute("data-theme"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(doc, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme || "dark";
}

function preload(src?: string) {
  if (!src) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export function GlobalBackdrop() {
  const currentCover = usePlayerStore((s) => s.currentTrack?.coverUrl);
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);
  const [sources, setSources] = useState<(string | undefined)[]>([currentCover, undefined]);
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const theme = useThemeAttr();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!currentCover || sources[activeLayer] === currentCover) return;
    let cancelled = false;
    const nextLayer: 0 | 1 = activeLayer === 0 ? 1 : 0;

    preload(currentCover).then((ok) => {
      if (!ok || cancelled) return;
      setSources((prev) => {
        const next = [...prev];
        next[nextLayer] = currentCover;
        return next;
      });
      if (reducedMotion) {
        setActiveLayer(nextLayer);
        return;
      }
      setTransitioning(true);
      requestAnimationFrame(() => {
        setActiveLayer(nextLayer);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setTransitioning(false), DURATION);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [currentCover, activeLayer, reducedMotion, sources]);

  const overlayColor = theme === "light" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.6)";
  const layerClass =
    "absolute inset-0 bg-center bg-cover bg-no-repeat transition-opacity ease-[cubic-bezier(0.2,0,0.2,1)]";

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {[0, 1].map((idx) => (
        <div
          key={idx}
          className={layerClass}
          style={{
            opacity: activeLayer === idx ? 1 : 0,
            transitionDuration: reducedMotion ? "0ms" : `${DURATION}ms`,
            backgroundImage: sources[idx] ? `url(${sources[idx]})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(24px)",
            willChange: transitioning ? "opacity" : undefined
          }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: overlayColor }} />
    </div>
  );
}
