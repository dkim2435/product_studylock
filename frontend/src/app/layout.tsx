import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import ClarityInit from "./ClarityInit";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://studylock.vercel.app";
const SITE_NAME = "StudyLock";
const SITE_TITLE = "StudyLock - Study Together in a Pixel-Art Library";
const SITE_DESCRIPTION =
  "A real-time collaborative study room with pixel-art visuals, ambience sounds, and pomodoro timer. No login required.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "study room",
    "study with me",
    "pomodoro",
    "ambience",
    "focus",
    "pixel art",
    "study timer",
    "online study room",
    "lofi study",
    "virtual study room",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#0c0a09",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "StudyLock",
                  url: "https://studylock.vercel.app",
                  description:
                    "A real-time collaborative study room with pixel-art visuals, ambience sounds, and pomodoro timer.",
                },
                {
                  "@type": "WebApplication",
                  name: "StudyLock",
                  url: "https://studylock.vercel.app",
                  applicationCategory: "EducationalApplication",
                  operatingSystem: "Any",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                  featureList: [
                    "Real-time collaborative study rooms",
                    "Pixel-art library visuals",
                    "Ambience sound mixer",
                    "Pomodoro timer",
                    "No login required",
                  ],
                },
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "What is StudyLock?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "StudyLock is a free, real-time collaborative study room with pixel-art visuals, ambience sounds, and a built-in pomodoro timer. No login required.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Do I need to create an account to use StudyLock?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "No. StudyLock requires no login or account creation. Just open the site and start studying.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Is StudyLock free?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes, StudyLock is completely free to use.",
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
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
