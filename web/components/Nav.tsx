import Link from "next/link";

// Shared top navigation. Only links to pages that actually exist yet - the
// incident-report page (Phase 7) gets added here once it's built.
export function Nav() {
  return (
    <nav className="flex items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Link href="/" className="font-semibold">
        דפיברילטורים ניידים
      </Link>
      <div className="flex gap-6 text-sm">
        <Link href="/register" className="hover:underline">
          הרשמה
        </Link>
        <Link href="/admin/login" className="hover:underline">
          כניסת מנהל
        </Link>
      </div>
    </nav>
  );
}
