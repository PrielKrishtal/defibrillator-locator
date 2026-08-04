import { AuthProvider } from "@/lib/auth-context";

// One shared auth context for the whole admin section (silent refresh runs
// once, not per page). The redirect-if-unauthenticated check stays in
// page.tsx, not here - here it would also guard /admin/login and loop.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
