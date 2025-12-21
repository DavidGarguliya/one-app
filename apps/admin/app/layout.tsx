import "../app/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ProSound Admin",
  description: "Управление каталогом персональных песен"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased bg-[#050505] text-white">
        <div className="min-h-screen flex">{children}</div>
      </body>
    </html>
  );
}
