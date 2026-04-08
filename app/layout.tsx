import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { MusicProvider } from "@/lib/music-context";
import { MiniPlayer } from "@/components/mini-player";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Devotional",
  description: "A guided daily Bible study for ADHD minds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <SessionProvider>
          <MusicProvider>
            {children}
            <MiniPlayer />
          </MusicProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
