import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Remotion + VoiSona Example",
  description: "Minimal admin UI for VoiSona and Remotion",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
