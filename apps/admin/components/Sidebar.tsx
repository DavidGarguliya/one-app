"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "classnames";
import { Home, Music, ListMusic, Tag, Palette, Smile, Calendar, Users, Menu, X } from "lucide-react";

const defaultLinks = [
  { href: "/", label: "Дашборд", icon: Home },
  { href: "/tracks", label: "Треки", icon: Music },
  { href: "/playlists", label: "Плейлисты", icon: ListMusic },
  { href: "/tags", label: "Теги", icon: Tag },
  { href: "/styles", label: "Стили", icon: Palette },
  { href: "/genres", label: "Жанры", icon: Palette },
  { href: "/moods", label: "Настроения", icon: Smile },
  { href: "/occasions", label: "Поводы", icon: Calendar },
  { href: "/users", label: "Пользователи", icon: Users }
];

export function Sidebar() {
  const pathname = typeof window !== "undefined" ? usePathname() : "/";
  const [open, setOpen] = useState(true);
  const [links, setLinks] = useState(defaultLinks);
  const [dragging, setDragging] = useState<string | null>(null);

  const handleDragStart = (href: string) => setDragging(href);
  const handleDragOver = (e: React.DragEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (!dragging || dragging === href) return;
    setLinks((prev) => {
      const fromIdx = prev.findIndex((l) => l.href === dragging);
      const toIdx = prev.findIndex((l) => l.href === href);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  };
  const handleDragEnd = () => setDragging(null);

  return (
    <>
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-40 rounded-full bg-white/10 border border-white/10 p-2 backdrop-blur-lg"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle sidebar"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      <aside
        className={clsx(
          "w-64 border-r border-white/10 p-4 space-y-2 bg-[color-mix(in srgb,var(--bg) 80%,transparent)] backdrop-blur-xl transition-transform duration-200 fixed md:static z-30 h-full md:h-auto",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">ProSound Admin</h2>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5 transition",
                  active ? "bg-white/10 text-white" : "text-white/80"
                )}
                onClick={() => setOpen(false)}
                draggable
                onDragStart={() => handleDragStart(link.href)}
                onDragOver={(e) => handleDragOver(e, link.href)}
                onDragEnd={handleDragEnd}
              >
                <Icon size={16} className={active ? "text-[var(--accent)]" : "text-white/70"} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
