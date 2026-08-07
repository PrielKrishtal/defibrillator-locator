import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "./globals.css";

// Heebo, not the scaffold's default Geist: Geist's subset here is Latin-only,
// so Hebrew would silently fall back to the browser default. Heebo supports
// Hebrew and reads right in RTL.
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "מערכת דפיברילטורים ניידים",
  description:
    "מערכת סימולציה לאיתור מתנדבים עם דפיברילטור נייד בקרבת אירוע דום לב",
};

// WHY force-dynamic: Footer (rendered here, on every route) and the
// homepage both read admin-editable site_content directly from Mongo, not
// via fetch() - Next.js's default static-generation heuristics don't know
// that data can change, so without this, an admin's save landed in the
// database but production kept serving the build-time HTML until the next
// deploy. This trades static-shell caching for always-fresh admin content.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang/dir set once at the root so every page and native control
    // (inputs, checkboxes) inherits Hebrew/RTL automatically.
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {/* Plain <link>, not next/font/google: this project's folder path is
            long enough that Turbopack's dev-cache path exceeded Windows'
            MAX_PATH for these two longer font names (broke `next dev`, not
            `next build`) - Heebo's short name is unaffected. Inside <body>
            since React 19 hoists link tags into <head> regardless, and
            <html> only allows <head>/<body> as children. This layout wraps
            every route exactly once, so the lint rule below's usual concern
            (a font link outside _document.js loading on only one page)
            doesn't apply. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
