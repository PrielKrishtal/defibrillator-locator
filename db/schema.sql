-- Run this once in the Supabase SQL editor (or via `psql`) to create the
-- two SQL tables this project needs. Registrations is the public-facing
-- table (anyone can insert via the registration form, no auth required).
-- Admins is the auth server's user table (only the seed script and the
-- auth server touch it).

CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  mobile TEXT NOT NULL,
  -- nullable: a registrant can be LoRa-only (no defibrillator) or
  -- defibrillator-only (no LoRa), so this field can't be required.
  lora_id TEXT,
  has_defibrillator BOOLEAN DEFAULT true,
  has_lora BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  -- bcrypt hash only. The seed script below is the one place that ever
  -- sees the plaintext password, and only to hash it before insert.
  password_hash TEXT NOT NULL
);

-- One row per issued refresh token. The auth server checks this table on
-- /refresh (the token's jti must still be here) and deletes the row on
-- /logout. That's what makes a refresh token revocable before it expires -
-- a signed-but-deleted token is rejected even though its signature is valid.
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  -- ON DELETE CASCADE: if an admin is ever removed, their outstanding
  -- refresh tokens go with them instead of dangling.
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  -- the refresh token's unique id (a random UUID baked into the JWT). We
  -- store only this id, never the token string itself.
  jti TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- WHY: tables created through the SQL editor don't automatically get
-- privileges for Supabase's built-in Postgres roles (only tables created
-- through the dashboard Table Editor do). Without these grants, even the
-- service_role key gets "permission denied for table" on every query.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refresh_tokens TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.registrations_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.admins_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.refresh_tokens_id_seq TO service_role;
