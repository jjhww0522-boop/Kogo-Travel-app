import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TabBar from "@/components/TabBar";
import NaverMapScript from "@/components/NaverMapScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KoGo - Your Seoul Travel Guide",
  description:
    "Precision travel guide for foreign visitors to Korea. Subway exits, bus stops, and local tips—all in English.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NaverMapScript />
        {children}
        <TabBar />
      </body>
    </html>
  );
}
