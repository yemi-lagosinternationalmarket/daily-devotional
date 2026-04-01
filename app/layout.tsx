import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
