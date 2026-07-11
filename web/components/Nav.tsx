import Link from "next/link";

// Shared top navigation. Site name uses font-display (the Hebrew serif) -
// the one place in the chrome that gets it, since it's brand, not body copy.
// Full-bleed bar (no max-width) with its own inner padding is the standard
// header pattern - the content below it is what gets width-constrained.
export function Nav() {
  return (
    <nav className="flex items-center justify-between gap-4 border-b border-line px-6 py-5 sm:px-8">
      <Link href="/" className="font-display text-lg font-medium">
        דפיברילטורים ניידים
      </Link>
      <div className="flex gap-6 text-sm text-ink/70">
        <Link href="/incident" className="transition-colors hover:text-signal">
          מצוקה
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
