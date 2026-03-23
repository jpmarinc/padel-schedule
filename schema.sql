-- ============================================================
-- Padel Schedule — Schema Supabase
-- Proyecto: fwcjolnhghqqbclrbdrc (mismo que mi-trading)
-- ============================================================

-- Jugadores
CREATE TABLE IF NOT EXISTS padel_players (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  is_galleta  BOOLEAN DEFAULT FALSE,  -- jugador suplente/invitado
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Temporadas
CREATE TABLE IF NOT EXISTS padel_seasons (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  started_at      DATE NOT NULL,
  ended_at        DATE,
  total_dates     INT DEFAULT 12,
  ranking_mode    TEXT DEFAULT 'best_n',  -- 'absolute' | 'winrate' | 'best_n'
  best_n          INT,                    -- NULL = automático
  min_pj          INT DEFAULT 6,          -- mínimo PJ para aparecer en ranking (winrate)
  champion_id     UUID REFERENCES padel_players(id),
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Fechas / Lunes
CREATE TABLE IF NOT EXISTS padel_matches (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id           UUID REFERENCES padel_seasons(id) ON DELETE CASCADE,
  match_date          DATE NOT NULL,
  date_number         INT NOT NULL,  -- 1 al 12
  counts_for_points   BOOLEAN DEFAULT TRUE,  -- false si no hay quórum
  status              TEXT DEFAULT 'pending',  -- 'pending' | 'drawn' | 'played'
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Jugadores por partido (resultado del sorteo)
CREATE TABLE IF NOT EXISTS padel_match_players (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id    UUID REFERENCES padel_matches(id) ON DELETE CASCADE,
  player_id   UUID REFERENCES padel_players(id),
  team        INT NOT NULL,           -- 1 o 2
  position    TEXT NOT NULL,          -- 'drive' | 'reves'
  is_free     BOOLEAN DEFAULT FALSE   -- el jugador que descansó ese lunes
);

-- Resultados
CREATE TABLE IF NOT EXISTS padel_match_results (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id        UUID REFERENCES padel_matches(id) ON DELETE CASCADE UNIQUE,
  winner_team     INT NOT NULL,   -- 1 o 2
  sets            JSONB,          -- [{t1: 6, t2: 4}, {t1: 3, t2: 6}, ...]
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Seed: Jugadores titulares
-- ============================================================
INSERT INTO padel_players (name, is_galleta) VALUES
  ('Mario San Martin',   FALSE),
  ('Juan Carlos Awad',   FALSE),
  ('Jose Luis Mosso',    FALSE),
  ('Nicolas Gonzalez',   FALSE),
  ('Juan Pablo Marin',   FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Temporada inicial
-- ============================================================
INSERT INTO padel_seasons (name, started_at, total_dates, ranking_mode, best_n, min_pj)
VALUES ('Temporada 1 — 2026', '2026-03-24', 12, 'best_n', NULL, 6)
ON CONFLICT DO NOTHING;
