-- ── WaterQuest Database Schema ────────────────────────────────────────────────
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Weekly quests selected by AI pipeline
CREATE TABLE IF NOT EXISTS weekly_quests (
  id             SERIAL PRIMARY KEY,
  week_label     TEXT NOT NULL,
  quest_a        JSONB NOT NULL,
  quest_b        JSONB NOT NULL,
  satellite_data JSONB,
  ai_reasoning   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- User-submitted pollution photos
CREATE TABLE IF NOT EXISTS pollution_photos (
  id           SERIAL PRIMARY KEY,
  quest_id     INT REFERENCES weekly_quests(id),
  user_id      TEXT,
  team         TEXT CHECK (team IN ('A','B')),
  gps_lat      FLOAT NOT NULL,
  gps_lng      FLOAT NOT NULL,
  litter_type  TEXT,
  severity     TEXT,
  item_count   INT DEFAULT 0,
  confidence   FLOAT,
  is_valid     BOOLEAN DEFAULT FALSE,
  points       INT DEFAULT 0,
  photo_url    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Team scores (updated real-time)
CREATE TABLE IF NOT EXISTS team_scores (
  id                SERIAL PRIMARY KEY,
  quest_id          INT REFERENCES weekly_quests(id),
  team              TEXT CHECK (team IN ('A','B')),
  participant_count INT DEFAULT 0,
  total_points      INT DEFAULT 0,
  kg_removed        FLOAT DEFAULT 0,
  goal_pct          FLOAT DEFAULT 0,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Satellite readings per zone per week
CREATE TABLE IF NOT EXISTS satellite_readings (
  id                SERIAL PRIMARY KEY,
  zone_name         TEXT NOT NULL,
  week_label        TEXT NOT NULL,
  ndci_mean         FLOAT,
  fdi_max           FLOAT,
  turbidity_mean    FLOAT,
  water_pixels      INT,
  citizen_reports   INT DEFAULT 0,
  citizen_confirmed BOOLEAN DEFAULT FALSE,
  satellite_links   JSONB,
  reading_date      DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Enable real-time on team_scores
-- After running this SQL, go to:
-- Dashboard → Database → Replication → team_scores → toggle ON
