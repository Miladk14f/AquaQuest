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

-- ── User profiles (one row per auth.users row) ─────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         TEXT UNIQUE,
  email            TEXT,
  avatar_url       TEXT,
  total_points     INT DEFAULT 0,
  photos_submitted INT DEFAULT 0,
  cleanups_attended INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all profiles"  ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ── Point events log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_point_events (
  id         SERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id   INT  REFERENCES weekly_quests(id),
  event_type TEXT NOT NULL,
  points     INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_point_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own events"   ON user_point_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON user_point_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Rankings view (used by leaderboard) ────────────────────────────────────
DROP VIEW IF EXISTS user_rankings;
CREATE VIEW user_rankings AS
SELECT
  id,
  username,
  email,
  avatar_url,
  total_points,
  photos_submitted,
  cleanups_attended,
  RANK() OVER (ORDER BY total_points DESC) AS rank
FROM user_profiles
WHERE total_points > 0;

-- ── Auto-create profile on signup ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── RPC: atomically increment points + counters ────────────────────────────
CREATE OR REPLACE FUNCTION increment_user_points(
  p_user_id UUID,
  p_points  INT,
  p_photos  INT DEFAULT 0
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    total_points     = total_points + p_points,
    photos_submitted = photos_submitted + p_photos
  WHERE id = p_user_id;
END;
$$;
