import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EUODIA by Papa joe's Food",
  description: "Sistem kasir EUODIA by Papa joe's Food",
};

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
