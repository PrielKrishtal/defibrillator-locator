// The revocation layer. A refresh token is only accepted if its jti is still
// present in the refresh_tokens table. These four functions are the only code
// that touches that table.

import { supabase } from "./supabase";

// Takes an admin id, a refresh token's jti, and its expiry date, and
// inserts one row recording that this token is currently valid.
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

// Takes a refresh token's jti and returns true if it's still present in
// refresh_tokens - false if it was revoked or never existed.
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

// Takes a refresh token's jti and deletes its row, revoking that token
// immediately even though its signature and expiry are still valid.
export async function deleteJti(jti: string): Promise<void> {
  const { error } = await supabase
    .from("refresh_tokens")
    .delete()
    .eq("jti", jti);
  if (error) {
    throw new Error(`Failed to delete refresh token: ${error.message}`);
  }
}

// Takes an admin id and deletes all of that admin's already-expired
// refresh-token rows, so the table doesn't grow without bound.
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
