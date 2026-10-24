import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aktivasi GMaps — Aktivasi Kartu Google Maps UMKM",
  description: "Platform aktivasi kartu NFC dan QR Code untuk redirect ke Google Maps bisnis UMKM Anda.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
