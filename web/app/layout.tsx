import type { Metadata } from "next";
import { Heebo } from "next/font/google";
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
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
