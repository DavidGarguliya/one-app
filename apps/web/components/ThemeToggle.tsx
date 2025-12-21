"use client";
import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const manualChoice = useRef(false);
  const STORAGE_KEY = "prosound_theme";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const apply = (val: "light" | "dark") => {
      setTheme(val);
      document.documentElement.setAttribute("data-theme", val);
    };
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      manualChoice.current = true;
      apply(stored);
    } else {
      apply(mq.matches ? "light" : "dark");
    }
    const handler = (e: MediaQueryListEvent) => {
      if (manualChoice.current) return;
      apply(e.matches ? "light" : "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = () => {
    const next: "light" | "dark" = theme === "light" ? "dark" : "light";
    manualChoice.current = true;
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
