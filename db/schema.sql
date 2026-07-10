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
