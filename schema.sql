-- =========================
-- PeakGuide - schema.sql
-- PostgreSQL
-- =========================

BEGIN;

-- Extensions (opcjonalnie)
-- CREATE EXTENSION IF NOT EXISTS citext;

-- -------------------------
-- 1) Languages
-- -------------------------
CREATE TABLE IF NOT EXISTS languages (
  code VARCHAR(8) PRIMARY KEY,         -- 'pl', 'en', 'de', 'zh'
  name TEXT NOT NULL
);

INSERT INTO languages (code, name)
VALUES ('pl','Polski'), ('en','English')
ON CONFLICT (code) DO NOTHING;

-- -------------------------
-- 2) Users (Auth)
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------
-- 3) Mountain ranges & subranges (pasma i podpasma)
-- -------------------------
CREATE TABLE IF NOT EXISTS mountain_ranges (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,           -- e.g. 'tatry', 'bieszczady'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mountain_ranges_i18n (
  range_id BIGINT NOT NULL REFERENCES mountain_ranges(id) ON DELETE CASCADE,
  lang VARCHAR(8) NOT NULL REFERENCES languages(code),
  name TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (range_id, lang)
);

CREATE TABLE IF NOT EXISTS subranges (
  id BIGSERIAL PRIMARY KEY,
  range_id BIGINT NOT NULL REFERENCES mountain_ranges(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (range_id, slug)
);

CREATE TABLE IF NOT EXISTS subranges_i18n (
  subrange_id BIGINT NOT NULL REFERENCES subranges(id) ON DELETE CASCADE,
  lang VARCHAR(8) NOT NULL REFERENCES languages(code),
  name TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (subrange_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_subranges_range_id ON subranges(range_id);

-- -------------------------
-- 4) Peaks
-- -------------------------
CREATE TABLE IF NOT EXISTS peaks (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,           -- e.g. 'rysy', 'tarnica'
  range_id BIGINT NOT NULL REFERENCES mountain_ranges(id),
  subrange_id BIGINT REFERENCES subranges(id),
  elevation_m INTEGER NOT NULL CHECK (elevation_m > 0),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  difficulty TEXT,                     -- 'easy'|'moderate'|'hard' (możesz potem zrobić enum)
  best_season TEXT,                    -- np. 'Apr-Oct'
  cover_image_url TEXT,
  is_korona BOOLEAN NOT NULL DEFAULT true, -- Korona Gór Polski
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS peaks_i18n (
  peak_id BIGINT NOT NULL REFERENCES peaks(id) ON DELETE CASCADE,
  lang VARCHAR(8) NOT NULL REFERENCES languages(code),
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  tips TEXT,                           -- np. porady / uwagi
  PRIMARY KEY (peak_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_peaks_range_id ON peaks(range_id);
CREATE INDEX IF NOT EXISTS idx_peaks_subrange_id ON peaks(subrange_id);
CREATE INDEX IF NOT EXISTS idx_peaks_elevation ON peaks(elevation_m);

-- -------------------------
-- 5) Trails (szlaki)
-- -------------------------
CREATE TABLE IF NOT EXISTS trails (
  id BIGSERIAL PRIMARY KEY,
  peak_id BIGINT NOT NULL REFERENCES peaks(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  start_point_name TEXT,               -- “Kuźnice”, “Wołosate”
  end_point_name TEXT,                 -- opcjonalnie (jeśli pętla / inny punkt)
  distance_km NUMERIC(5,2),
  elevation_gain_m INTEGER,
  time_min INTEGER,                    -- czas przejścia w minutach
  difficulty TEXT,
  route_type TEXT,                     -- 'out-and-back','loop','one-way' (opcjonalnie)
  gpx_url TEXT,
  map_url TEXT,                        -- link do mapy (np. mapa-turystyczna / google)
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (peak_id, slug)
);

CREATE TABLE IF NOT EXISTS trails_i18n (
  trail_id BIGINT NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  lang VARCHAR(8) NOT NULL REFERENCES languages(code),
  name TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  PRIMARY KEY (trail_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_trails_peak_id ON trails(peak_id);

-- -------------------------
-- 6) POI types + POIs
-- -------------------------
CREATE TABLE IF NOT EXISTS poi_types (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE            -- 'shelter','viewpoint','transport','trailhead','attraction','accommodation'
);

CREATE TABLE IF NOT EXISTS poi_types_i18n (
  type_id BIGINT NOT NULL REFERENCES poi_types(id) ON DELETE CASCADE,
  lang VARCHAR(8) NOT NULL REFERENCES languages(code),
  name TEXT NOT NULL,
  PRIMARY KEY (type_id, lang)
);

INSERT INTO poi_types (slug) VALUES
  ('shelter'),
  ('viewpoint'),
  ('transport'),
  ('trailhead'),
  ('attraction'),
  ('accommodation')
ON CONFLICT (slug) DO NOTHING;

-- minimalne tłumaczenia PL/EN (możesz rozszerzać)
INSERT INTO poi_types_i18n (type_id, lang, name)
SELECT id, 'pl', CASE slug
  WHEN 'shelter' THEN 'Schronisko'
  WHEN 'viewpoint' THEN 'Punkt widokowy'
  WHEN 'transport' THEN 'Transport'
  WHEN 'trailhead' THEN 'Punkt startowy'
  WHEN 'attraction' THEN 'Atrakcja'
  WHEN 'accommodation' THEN 'Nocleg'
END
FROM poi_types
ON CONFLICT (type_id, lang) DO NOTHING;

INSERT INTO poi_types_i18n (type_id, lang, name)
SELECT id, 'en', CASE slug
  WHEN 'shelter' THEN 'Mountain hut'
  WHEN 'viewpoint' THEN 'Viewpoint'
  WHEN 'transport' THEN 'Transport'
  WHEN 'trailhead' THEN 'Trailhead'
  WHEN 'attraction' THEN 'Attraction'
  WHEN 'accommodation' THEN 'Accommodation'
END
FROM poi_types
ON CONFLICT (type_id, lang) DO NOTHING;

CREATE TABLE IF NOT EXISTS pois (
  id BIGSERIAL PRIMARY KEY,
  peak_id BIGINT REFERENCES peaks(id) ON DELETE CASCADE,
  trail_id BIGINT REFERENCES trails(id) ON DELETE CASCADE,
  type_id BIGINT NOT NULL REFERENCES poi_types(id),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  website_url TEXT,
  google_maps_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- POI musi być przypięte do peak albo trail (co najmniej jedno)
  CHECK (peak_id IS NOT NULL OR trail_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS pois_i18n (
  poi_id BIGINT NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  lang VARCHAR(8) NOT NULL REFERENCES languages(code),
  name TEXT NOT NULL,
  description TEXT,
  tips TEXT,
  PRIMARY KEY (poi_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_pois_peak_id ON pois(peak_id);
CREATE INDEX IF NOT EXISTS idx_pois_trail_id ON pois(trail_id);
CREATE INDEX IF NOT EXISTS idx_pois_type_id ON pois(type_id);

-- -------------------------
-- 7) Nearby peaks (opcjonalne “inne szczyty w okolicy”)
-- -------------------------
CREATE TABLE IF NOT EXISTS peak_nearby (
  peak_id BIGINT NOT NULL REFERENCES peaks(id) ON DELETE CASCADE,
  nearby_peak_id BIGINT NOT NULL REFERENCES peaks(id) ON DELETE CASCADE,
  note TEXT,
  PRIMARY KEY (peak_id, nearby_peak_id),
  CHECK (peak_id <> nearby_peak_id)
);

-- -------------------------
-- 8) User peak status (planned/done)
-- -------------------------
CREATE TABLE IF NOT EXISTS user_peak_status (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peak_id BIGINT NOT NULL REFERENCES peaks(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('planned','done')),
  date_done DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, peak_id)
);

CREATE INDEX IF NOT EXISTS idx_user_peak_status_status ON user_peak_status(status);

COMMIT;
