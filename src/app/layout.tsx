import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter, Geist_Mono } from "next/font/google";
import IntroOverlay from "@/components/IntroOverlay";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "grofit — Train With Intent",
  description: "Personalized fitness, science-based workout routines, 3D equipment lab, and nutrition tracking with grofit",
  manifest: "/manifest.webmanifest?v=2",
  icons: {
    icon: [
      { url: "/images/grofit-crest.png?v=2", sizes: "415x415", type: "image/png" },
      { url: "/icon.png?v=2", sizes: "415x415", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: [
      { url: "/images/grofit-crest.png?v=2", sizes: "415x415", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "grofit",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${inter.variable} ${geistMono.variable} dark h-full antialiased`}
      style={{ colorScheme: 'dark', backgroundColor: '#000000' }}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('grofit_intro_seen')==='true'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('intro-seen');}}catch(e){}`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col text-white selection:bg-[#ff2a3b] selection:text-white relative bg-[#000000]"
        style={{ backgroundColor: '#000000' }}
      >
        <IntroOverlay />
        <div className="relative flex min-h-full flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
