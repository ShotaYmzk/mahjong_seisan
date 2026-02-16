-- Add tobi (bust-out) bonus settings to rule_sets
ALTER TABLE rule_sets ADD COLUMN tobi_bonus_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE rule_sets ADD COLUMN tobi_bonus_points integer NOT NULL DEFAULT 0;
ALTER TABLE rule_sets ADD COLUMN tobi_bonus_chips integer NOT NULL DEFAULT 0;
ALTER TABLE rule_sets ADD COLUMN tobi_receiver_type text NOT NULL DEFAULT 'top'
  CHECK (tobi_receiver_type IN ('top', 'manual'));

-- Track who busted a player (for manual receiver mode)
ALTER TABLE round_results ADD COLUMN tobi_by_player_id uuid REFERENCES session_players(id);
