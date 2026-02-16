-- Add player_count to rule_sets to support 3-player mahjong (三人麻雀/サンマ)
-- For 3-player sessions, uma_4 is unused (set to 0)
ALTER TABLE rule_sets
  ADD COLUMN player_count integer NOT NULL DEFAULT 4
  CHECK (player_count IN (3, 4));

COMMENT ON COLUMN rule_sets.player_count IS '対局人数: 3=三人麻雀, 4=四人麻雀';
