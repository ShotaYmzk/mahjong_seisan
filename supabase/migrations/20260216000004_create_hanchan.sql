-- Hanchan (rounds): individual games within a session
CREATE TABLE hanchan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seq integer NOT NULL,
  is_confirmed boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, seq)
);

CREATE INDEX idx_hanchan_session ON hanchan (session_id, seq);

-- Round results: per-player scores in a hanchan
-- session_id is denormalized for efficient Realtime subscription filtering
CREATE TABLE round_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hanchan_id uuid NOT NULL REFERENCES hanchan(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  raw_score integer NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  UNIQUE (hanchan_id, player_id)
);

CREATE INDEX idx_round_results_hanchan ON round_results (hanchan_id);
CREATE INDEX idx_round_results_session ON round_results (session_id);

ALTER TABLE hanchan ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_results ENABLE ROW LEVEL SECURITY;
