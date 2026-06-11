import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Remotion + VoiSona Template",
  description: "Template app for VoiSona-driven video editing and Remotion rendering",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
