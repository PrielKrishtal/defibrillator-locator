// The revocation layer. A refresh token is only accepted if its jti is still
// present in the refresh_tokens table. These four functions are the only code
// that touches that table.

import { supabase } from "./supabase";

// Record a newly issued refresh token so it counts as valid.
export async function storeJti(
  adminId: number,
  jti: string,
  expiresAt: Date
): Promise<void> {
  const { error } = await supabase
    .from("refresh_tokens")
    .insert({ admin_id: adminId, jti, expires_at: expiresAt.toISOString() });
  if (error) {
    throw new Error(`Failed to store refresh token: ${error.message}`);
  }
}

// True if this jti has not been revoked (i.e. the row still exists).
export async function isJtiValid(jti: string): Promise<boolean> {
  // WHY maybeSingle: we expect zero or one row. It returns null (not an
  // error) when the jti is absent, which is exactly the revoked case.
  const { data, error } = await supabase
    .from("refresh_tokens")
    .select("jti")
    .eq("jti", jti)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to look up refresh token: ${error.message}`);
  }
  return data !== null;
}

// Revoke one refresh token (logout).
export async function deleteJti(jti: string): Promise<void> {
  const { error } = await supabase
    .from("refresh_tokens")
    .delete()
    .eq("jti", jti);
  if (error) {
    throw new Error(`Failed to delete refresh token: ${error.message}`);
  }
}

// Housekeeping: drop this admin's already-expired rows so the table doesn't
// grow without bound. Called on login, a natural moment to tidy up.
export async function deleteExpiredForAdmin(adminId: number): Promise<void> {
  const { error } = await supabase
    .from("refresh_tokens")
    .delete()
    .eq("admin_id", adminId)
    .lt("expires_at", new Date().toISOString());
  if (error) {
    throw new Error(`Failed to clean up expired refresh tokens: ${error.message}`);
  }
}
