import type { Metadata } from "next";
import { Geist, Geist_Mono, Poor_Story } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poorStory = Poor_Story({
  variable: "--font-poor-story",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Splity - Split Bills with AI",
  description: "Effortlessly split bills with friends using AI. Scan, assign, and settle up in seconds.",
  icons: {
    icon: "/assets/elements/logo.svg",
    apple: "/assets/elements/logo.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poorStory.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
