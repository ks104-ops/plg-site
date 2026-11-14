-- Marketing Check-Up responses
CREATE TABLE IF NOT EXISTS responses (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,              -- ISO 8601, UTC
  business    TEXT NOT NULL,
  area        TEXT NOT NULL,
  goal        TEXT NOT NULL,
  sources     TEXT NOT NULL,              -- JSON array
  gbp         TEXT NOT NULL,
  seo         TEXT NOT NULL,
  gbp_know    TEXT NOT NULL,
  missed      TEXT NOT NULL,
  ask         TEXT NOT NULL,
  reply       TEXT NOT NULL,
  frustration TEXT NOT NULL DEFAULT '',
  budget      TEXT NOT NULL,
  top3        TEXT NOT NULL,              -- JSON array of opportunity keys
  token_hash  TEXT NOT NULL,              -- lets the same visitor add contact info once
  name        TEXT,
  business_name TEXT,
  contact     TEXT,
  contact_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_responses_created ON responses(created_at);

-- Rate limiting. Stores a keyed hash of the visitor's IP, never the IP itself. Rows older than a day are deleted.
CREATE TABLE IF NOT EXISTS hits (
  bucket TEXT NOT NULL,
  key    TEXT NOT NULL,
  ts     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hits ON hits(bucket, key, ts);
