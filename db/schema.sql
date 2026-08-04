-- Run once in the Supabase SQL editor. registrations is public-insert (the
-- registration form); admins is auth-server's user table only.

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

-- One row per issued refresh token. /refresh checks the jti is still here;
-- /logout deletes it - what makes a token revocable before it expires.
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

-- Tables made via the SQL editor don't get default role privileges (only
-- dashboard-created ones do) - without these, service_role gets denied.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refresh_tokens TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.registrations_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.admins_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.refresh_tokens_id_seq TO service_role;
