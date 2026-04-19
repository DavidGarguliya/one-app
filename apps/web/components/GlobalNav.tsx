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

type NavHref = Parameters<typeof Link>[0]["href"];
type NavItem = { href: NavHref; label: string; icon: typeof House };

const links: NavItem[] = [
  { href: "/", label: "Главная", icon: House },
  { href: "/catalog", label: "Каталог", icon: Compass },
  { href: "/playlists", label: "Плейлисты", icon: SquaresFour }
];

export function GlobalNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
                key={label}
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

          <div className="hidden md:flex items-center gap-2 ml-auto">
            <button
              type="button"
              className="flex items-center justify-center h-10 w-10 rounded-full text-[var(--fg)] hover:bg-white/5 focus:outline-none focus:ring-[var(--focus-ring)]"
              onClick={() => setSearchOpen(true)}
              aria-label="Поиск"
            >
              <MagnifyingGlass size={18} />
            </button>
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
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 transition-opacity duration-200 animate-[fadeIn_200ms_ease]"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl transition-transform duration-200 animate-[slideUp_200ms_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="flex items-center gap-2 rounded-full bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-4 py-3 shadow-[var(--shadow-card)] focus-within:ring-[var(--focus-ring)]">
              <MagnifyingGlass size={18} className="text-[var(--muted)]" />
              <input
                autoFocus
                aria-label="Поиск треков"
                defaultValue={query}
                onChange={(e) => onChange(e.target.value)}
                className="text-base text-[var(--fg)] placeholder:text-[var(--muted)] w-full appearance-none bg-transparent focus:ring-0 outline-none"
                placeholder="Поиск по трекам"
              />
            </label>
          </div>
        </div>
      )}
    </>
  );
}
