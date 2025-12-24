"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 mb-16 w-full px-4 md:px-8 lg:px-12">
      <div className="w-full px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-transparent">
        <div>
          <p className="text-sm text-[var(--muted)]">ProSound</p>
          <p className="text-[var(--fg)]/85">Персональные песни и истории.</p>
        </div>
        <div className="text-xs text-[var(--muted)] flex gap-4">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/gdpr">GDPR</Link>
          <span>Status</span>
        </div>
      </div>
    </footer>
  );
}
