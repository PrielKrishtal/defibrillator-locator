import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

// WHY Heebo instead of the scaffold's default Geist font: Geist's Google
// Fonts subset here is Latin-only, so Hebrew text would silently fall back
// to the browser's default font. Heebo supports the Hebrew subset and is
// designed to look right in RTL layouts.
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "מערכת דפיברילטורים ניידים",
  description:
    "מערכת סימולציה לאיתור מתנדבים עם דפיברילטור נייד בקרבת אירוע דום לב",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // WHY lang="he" dir="rtl" on <html>, not lower down: the assignment
    // requires the whole site to default to Hebrew/RTL, and setting it once
    // at the root means every page and every browser-native control (form
    // inputs, checkboxes) inherits the correct direction automatically.
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      {/* WHY a plain <link>, not next/font/google, for these two: this
          project's folder path is already long enough that Turbopack's dev
          cache (which appends "[next]_internal_font_google_<name>_<hash>_
          module_css_..." to it) exceeds Windows' MAX_PATH for any
          longer-named font - it broke `next dev` (though not `next build`,
          whose cache path is a few characters shorter) for both fonts
          tried here. A plain stylesheet link skips that local-caching
          pipeline entirely; React 19 hoists <link> tags rendered anywhere
          in the tree into <head> automatically. Heebo's short name stays
          under the limit, so it's unaffected and stays on next/font/google.

          The lint rule below (no-page-custom-font) assumes the Pages
          Router, where a font <link> outside pages/_document.js really
          would only load on one page. This root layout is the App Router's
          equivalent of _document.js - it wraps every route exactly once -
          so that risk doesn't apply here. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
      />
      <body className="min-h-full flex flex-col font-sans">
        <Nav />
        {children}
      </body>
    </html>
  );
}
