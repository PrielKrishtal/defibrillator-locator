import Link from "next/link";

// Shared top navigation. Site name uses font-display (the Hebrew serif) -
// the one place in the chrome that gets it, since it's brand, not body copy.
export function Nav() {
  return (
    <nav className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
      <Link href="/" className="font-display text-lg font-medium">
        דפיברילטורים ניידים
      </Link>
      <div className="flex gap-6 text-sm">
        <Link href="/incident" className="hover:text-signal hover:underline">
          מצוקה
        </Link>
        <Link href="/register" className="hover:text-signal hover:underline">
          הרשמה
        </Link>
        <Link href="/admin/login" className="hover:text-signal hover:underline">
          כניסת מנהל
        </Link>
      </div>
    </nav>
  );
}
