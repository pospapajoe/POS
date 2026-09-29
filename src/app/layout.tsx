import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EUODIA by Papa joe's Food",
  description: "Sistem kasir EUODIA by Papa joe's Food",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
