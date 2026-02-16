-- Helper function: check if current user is a member of a given room
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = p_room_id
      AND user_id = auth.uid()
  );
$$;

-- Helper function: get room_id for a session
CREATE OR REPLACE FUNCTION public.get_room_id_for_session(p_session_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT room_id FROM sessions WHERE id = p_session_id;
$$;

-- ============================================================
-- ROOMS policies
-- ============================================================
CREATE POLICY "rooms_select_member"
  ON rooms FOR SELECT
  USING (public.is_room_member(id));

CREATE POLICY "rooms_insert_authenticated"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- ROOM_MEMBERS policies
-- ============================================================
CREATE POLICY "room_members_select_member"
  ON room_members FOR SELECT
  USING (public.is_room_member(room_id));

CREATE POLICY "room_members_insert_authenticated"
  ON room_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ============================================================
-- SESSIONS policies
-- ============================================================
CREATE POLICY "sessions_select_member"
  ON sessions FOR SELECT
  USING (public.is_room_member(room_id));

CREATE POLICY "sessions_insert_member"
  ON sessions FOR INSERT
  WITH CHECK (public.is_room_member(room_id));

CREATE POLICY "sessions_update_member"
  ON sessions FOR UPDATE
  USING (public.is_room_member(room_id));

-- ============================================================
-- SESSION_PLAYERS policies
-- ============================================================
CREATE POLICY "session_players_select_member"
  ON session_players FOR SELECT
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "session_players_insert_member"
  ON session_players FOR INSERT
  WITH CHECK (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "session_players_update_member"
  ON session_players FOR UPDATE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "session_players_delete_member"
  ON session_players FOR DELETE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

-- ============================================================
-- RULE_SETS policies
-- ============================================================
CREATE POLICY "rule_sets_select_member"
  ON rule_sets FOR SELECT
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "rule_sets_insert_member"
  ON rule_sets FOR INSERT
  WITH CHECK (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "rule_sets_update_member"
  ON rule_sets FOR UPDATE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

-- ============================================================
-- HANCHAN policies
-- ============================================================
CREATE POLICY "hanchan_select_member"
  ON hanchan FOR SELECT
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "hanchan_insert_member"
  ON hanchan FOR INSERT
  WITH CHECK (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "hanchan_update_member"
  ON hanchan FOR UPDATE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "hanchan_delete_member"
  ON hanchan FOR DELETE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

-- ============================================================
-- ROUND_RESULTS policies
-- ============================================================
CREATE POLICY "round_results_select_member"
  ON round_results FOR SELECT
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "round_results_insert_member"
  ON round_results FOR INSERT
  WITH CHECK (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "round_results_update_member"
  ON round_results FOR UPDATE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "round_results_delete_member"
  ON round_results FOR DELETE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

-- ============================================================
-- CHIP_EVENTS policies
-- ============================================================
CREATE POLICY "chip_events_select_member"
  ON chip_events FOR SELECT
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "chip_events_insert_member"
  ON chip_events FOR INSERT
  WITH CHECK (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "chip_events_update_member"
  ON chip_events FOR UPDATE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "chip_events_delete_member"
  ON chip_events FOR DELETE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

-- ============================================================
-- EXPENSES policies
-- ============================================================
CREATE POLICY "expenses_select_member"
  ON expenses FOR SELECT
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "expenses_insert_member"
  ON expenses FOR INSERT
  WITH CHECK (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "expenses_update_member"
  ON expenses FOR UPDATE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "expenses_delete_member"
  ON expenses FOR DELETE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

-- ============================================================
-- EXPENSE_SHARES policies
-- ============================================================
CREATE POLICY "expense_shares_select_member"
  ON expense_shares FOR SELECT
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "expense_shares_insert_member"
  ON expense_shares FOR INSERT
  WITH CHECK (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "expense_shares_delete_member"
  ON expense_shares FOR DELETE
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

-- ============================================================
-- ACTIVITY_LOG policies
-- ============================================================
CREATE POLICY "activity_log_select_member"
  ON activity_log FOR SELECT
  USING (public.is_room_member(public.get_room_id_for_session(session_id)));

CREATE POLICY "activity_log_insert_member"
  ON activity_log FOR INSERT
  WITH CHECK (public.is_room_member(public.get_room_id_for_session(session_id)));

-- ============================================================
-- Trigger: auto-update sessions.updated_at on child changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_session_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sessions SET updated_at = now()
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_hanchan_touch_session
  AFTER INSERT OR UPDATE OR DELETE ON hanchan
  FOR EACH ROW EXECUTE FUNCTION public.touch_session_updated_at();

CREATE TRIGGER trg_round_results_touch_session
  AFTER INSERT OR UPDATE OR DELETE ON round_results
  FOR EACH ROW EXECUTE FUNCTION public.touch_session_updated_at();

CREATE TRIGGER trg_chip_events_touch_session
  AFTER INSERT OR UPDATE OR DELETE ON chip_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_session_updated_at();

CREATE TRIGGER trg_expenses_touch_session
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_session_updated_at();

-- ============================================================
-- Enable Realtime for key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE hanchan;
ALTER PUBLICATION supabase_realtime ADD TABLE round_results;
ALTER PUBLICATION supabase_realtime ADD TABLE chip_events;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE rule_sets;
