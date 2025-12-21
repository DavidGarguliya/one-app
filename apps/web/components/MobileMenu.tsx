"use client";
import { useEffect } from "react";
import Link from "next/link";
import clsx from "classnames";
import { ThemeToggle } from "./ThemeToggle";
import { X } from "@phosphor-icons/react";
import { CtaButton } from "./CtaButton";
import { useSearchStore } from "../lib/searchStore";

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
};

export function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const setQuery = useSearchStore((s) => s.setQuery);
  return (
    <div
      className={clsx(
        "fixed inset-0 z-40 transition duration-300",
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={clsx(
          "absolute top-0 left-0 right-0 rounded-b-3xl bg-[var(--glass)] backdrop-blur-[var(--blur-amount)] border-b border-[var(--border)] shadow-[var(--shadow)]",
          "transition-transform duration-300",
          open ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-24 pb-4">
          <span className="font-semibold text-[var(--fg)]">Меню</span>
          <ThemeToggle />
        </div>
        <div className="px-5 pb-2">
          <input
            aria-label="Поиск"
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full bg-[color-mix(in srgb,var(--bg) 70%,transparent)] px-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] border border-[var(--border-strong)] outline-none focus:ring-[var(--focus-ring)] appearance-none"
            placeholder="Поиск по трекам"
          />
        </div>
        <nav className="flex flex-col gap-1 px-5 pb-4 pt-2 text-[var(--fg)]/80 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="px-3 py-2 rounded-xl hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" onClick={onClose} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-[var(--fg)]">Войти</Link>
            <CtaButton full href="/order" onClick={onClose} />
          </div>
        </nav>
      </div>
    </div>
  );
}
