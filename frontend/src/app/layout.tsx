import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CodeLens AI — Repository Intelligence",
    template: "%s — CodeLens AI",
  },
  description:
    "CodeLens AI analyzes GitHub repositories to deliver architectural insights, complexity heatmaps, dead code detection, and AI-powered onboarding dossiers.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('codelens-theme') || 'system';
                  var effective = 'dark';
                  if (mode === 'system') {
                    effective = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  } else {
                    effective = mode;
                  }
                  document.documentElement.setAttribute('data-theme', effective);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {/* Session is handled by the proxy and fetched client-side as needed */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
