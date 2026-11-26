import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Sora, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sora", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  title: "SAFAA by APSCO — Aviation fuel quality assurance",
  description: "Every sample. Every point. Proven. A JIG-aligned digital fuel sampling and quality assurance demo for APSCO, Jeddah.",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#0d0818", width: "device-width", initialScale: 1 };

// Applies persisted theme/lang before first paint (no flash).
const boot = `try{var t=localStorage.getItem('safaa.theme')==='dark'?'dark':'light';var l=localStorage.getItem('safaa.lang')||'en';var d=document.documentElement;d.setAttribute('data-theme',t);d.lang=l;d.dir=l==='ar'?'rtl':'ltr'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-theme="dark" suppressHydrationWarning className={`${inter.variable} ${sora.variable} ${arabic.variable}`}>
      <body className="font-sans antialiased">
        <Script id="safaa-boot" strategy="beforeInteractive">{boot}</Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
