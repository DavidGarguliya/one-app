import "../app/globals.css";
import type { Metadata } from "next";
import { Providers } from "../components/Providers";
import { PlayerBar } from "../components/PlayerBar";
import { GlobalNav } from "../components/GlobalNav";
import { SiteFooter } from "../components/SiteFooter";
import { GlobalBackdrop } from "../components/GlobalBackdrop";
import { InitialLoader } from "../components/InitialLoader";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ProSound",
  description: "ProSound — персональные песни и аудио" ,
  openGraph: {
    title: "ProSound",
    description: "Персональные песни, подарки и hi-fi стрим" ,
    images: ["/og.png"]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <GlobalBackdrop />
        <Providers>
          <InitialLoader />
          <div className="min-h-screen flex flex-col pt-24 md:pt-28">
            <div className="flex-1">
              <div className="px-4 md:px-8 lg:px-12 pt-4">
                <GlobalNav />
              </div>
              {children}
              <div className="px-4 md:px-8 lg:px-12">
                <SiteFooter />
              </div>
            </div>
            <PlayerBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
