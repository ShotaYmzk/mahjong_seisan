-- Rule sets: scoring rules for a session (1:1 with sessions)
CREATE TABLE rule_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  starting_points integer NOT NULL DEFAULT 25000,
  return_points integer NOT NULL DEFAULT 30000,
  uma_1 integer NOT NULL DEFAULT 10,
  uma_2 integer NOT NULL DEFAULT 5,
  uma_3 integer NOT NULL DEFAULT -5,
  uma_4 integer NOT NULL DEFAULT -10,
  oka_type text NOT NULL DEFAULT 'winner_take_all' CHECK (oka_type IN ('winner_take_all', 'none')),
  rate integer NOT NULL DEFAULT 100,
  rounding_unit integer NOT NULL DEFAULT 100,
  chip_rate integer NOT NULL DEFAULT 500,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rule_sets ENABLE ROW LEVEL SECURITY;
