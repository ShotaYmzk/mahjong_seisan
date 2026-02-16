-- Allow up to 6 players per session (5-6 players with rotation / 抜け番)
ALTER TABLE session_players DROP CONSTRAINT session_players_seat_order_check;
ALTER TABLE session_players ADD CONSTRAINT session_players_seat_order_check
  CHECK (seat_order BETWEEN 1 AND 6);
