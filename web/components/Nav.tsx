import Link from "next/link";

// Shared top nav. Site name uses font-display (Hebrew serif) - the one
// place in the chrome that gets it, since it's brand, not body copy.
export function Nav() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-6 py-5 sm:px-8">
      <Link href="/" className="font-display text-base font-medium sm:text-lg">
        דפיברילטורים ניידים
      </Link>
      <div className="flex gap-3 text-sm text-ink/70 sm:gap-6">
        <Link href="/incident" className="transition-colors hover:text-signal">
          סימולציית מצוקה
        </Link>
        <Link href="/register" className="transition-colors hover:text-signal">
          הרשמה
        </Link>
        <Link href="/admin/login" className="transition-colors hover:text-signal">
          כניסת מנהל
        </Link>
      </div>
    </nav>
  );
}
