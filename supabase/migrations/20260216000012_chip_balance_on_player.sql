-- Migrate from chip_events (individual transfers) to per-player chip counts.
-- Each player now records their ending chip count directly on session_players.
-- Net chips = chip_count - starting_chips (from rule_sets).

-- Add starting_chips to rule_sets (default 0 = net-change mode)
ALTER TABLE rule_sets
  ADD COLUMN starting_chips integer NOT NULL DEFAULT 0;

-- Add chip_count to session_players (NULL = not yet entered)
ALTER TABLE session_players
  ADD COLUMN chip_count integer DEFAULT NULL;
