import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import ClarityInit from "./ClarityInit";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyLock - Study Together in a Pixel-Art Library",
  description: "A real-time collaborative study room with pixel-art visuals, ambience sounds, and pomodoro timer. No login required.",
  keywords: ["study room", "study with me", "pomodoro", "ambience", "focus", "pixel art"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-950">
        <ClarityInit />
        {children}
      </body>
      {/* Google Analytics */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-727WZQDXSZ" strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-727WZQDXSZ');
      `}</Script>
    </html>
  );
}
