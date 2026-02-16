-- Chip events: chip transfers between players
CREATE TABLE chip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  from_player_id uuid NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  to_player_id uuid NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_player_id <> to_player_id)
);

CREATE INDEX idx_chip_events_session ON chip_events (session_id);

-- Expenses: shared costs (drinks, food, etc.)
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  description text,
  is_all_members boolean NOT NULL DEFAULT true,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_session ON expenses (session_id);

-- Expense shares: which players share an expense
-- session_id is denormalized for efficient Realtime subscription filtering
CREATE TABLE expense_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE (expense_id, player_id)
);

CREATE INDEX idx_expense_shares_expense ON expense_shares (expense_id);
CREATE INDEX idx_expense_shares_session ON expense_shares (session_id);

ALTER TABLE chip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;
