import { AuthProvider } from "@/lib/auth-context";

// Wraps both /admin/login and /admin (dashboard) in the same auth context,
// so the silent-refresh attempt on mount runs once for the whole admin
// section rather than being duplicated per page. The actual "redirect to
// login if not authenticated" check lives in app/admin/page.tsx itself, not
// here - putting it in this layout would also guard /admin/login and cause
// a redirect loop.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
