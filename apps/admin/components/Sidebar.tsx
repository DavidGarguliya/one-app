import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "classnames";

const links = [
  { href: "/", label: "Дашборд" },
  { href: "/tracks", label: "Треки" },
  { href: "/playlists", label: "Плейлисты" },
  { href: "/tags", label: "Теги" },
  { href: "/styles", label: "Стили" },
  { href: "/moods", label: "Настроения" },
  { href: "/occasions", label: "Поводы" },
  { href: "/users", label: "Пользователи" }
];

export function Sidebar() {
  const pathname = typeof window !== "undefined" ? usePathname() : "/";
  return (
    <aside className="w-60 border-r border-white/10 p-4 space-y-2 hidden md:block">
      <h2 className="text-lg font-semibold mb-4">ProSound Admin</h2>
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "block rounded-xl px-3 py-2 text-sm hover:bg-white/5",
              pathname === link.href ? "bg-white/10" : ""
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
