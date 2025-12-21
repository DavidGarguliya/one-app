"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "classnames";
import { House, Compass, SquaresFour, MagnifyingGlass } from "@phosphor-icons/react";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { CtaButton } from "./CtaButton";
import { useSearchStore } from "../lib/searchStore";

const links = [
  { href: "/", label: "Главная", icon: House },
  { href: "/catalog", label: "Каталог", icon: Compass },
  { href: "/playlists", label: "Плейлисты", icon: SquaresFour }
];

export function GlobalNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const onChange = useMemo(() => {
    let t: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(t);
      t = setTimeout(() => setQuery(value), 150);
    };
  }, [setQuery]);

  return (
    <>
      <div className="fixed top-[10px] left-0 right-0 z-50 px-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-3 w-full px-2 py-1">
          <Link
            href="/"
            className="font-semibold text-[var(--fg)] flex items-center gap-2"
            style={{ fontFamily: "'Sofia Sans Condensed', system-ui, sans-serif", fontWeight: 200, fontSize: "22px" }}
          >
            <img src="/assets/logo.svg" alt="ProSound" className="h-8 w-8 rounded-full" />
            ProSound
          </Link>

          <nav className="hidden md:flex items-center gap-2 text-sm text-[var(--fg)]/80">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-2 rounded-full px-3 py-2 transition",
                  pathname === href ? "bg-white/10 text-[var(--fg)]" : "hover:bg-white/5"
                )}
              >
                <Icon size={18} weight="fill" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 ml-auto w-64">
            <label className="flex items-center gap-2 rounded-full bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-3 py-[6px] shadow-[var(--shadow-card)] focus-within:ring-[var(--focus-ring)]">
              <MagnifyingGlass size={16} className="text-[var(--muted)]" />
              <input
                aria-label="Поиск треков"
                defaultValue={query}
                onChange={(e) => onChange(e.target.value)}
                className="nav-search-input text-sm text-[var(--fg)] placeholder:text-[var(--muted)] w-full appearance-none focus:ring-0"
                placeholder="Поиск по трекам"
              />
            </label>
          </div>

          <div className="ml-2 hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-[var(--fg)]/80">
              Войти
            </Link>
            <CtaButton href="/order" size="sm" />
            <ThemeToggle />
          </div>

          <motion.button
            className="md:hidden ml-auto h-10 w-10 rounded-full bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] text-[var(--fg)] focus:outline-none focus:ring-[var(--focus-ring)] flex items-center justify-center relative"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
          >
            <span
              className={clsx(
                "absolute left-2 right-2 h-0.5 bg-[var(--fg)] rounded-full transition-all duration-200",
                open ? "top-[18px] rotate-45" : "top-[12px] rotate-0"
              )}
            />
            <span
              className={clsx(
                "absolute left-2 right-2 h-0.5 bg-[var(--fg)] rounded-full transition-all duration-200",
                open ? "opacity-0 scale-x-0" : "top-[18px] opacity-100"
              )}
            />
            <span
              className={clsx(
                "absolute left-2 right-2 h-0.5 bg-[var(--fg)] rounded-full transition-all duration-200",
                open ? "top-[18px] -rotate-45" : "top-[24px] rotate-0"
              )}
            />
          </motion.button>
        </div>
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} links={links.map(({ icon, ...rest }) => rest)} />
    </>
  );
}
