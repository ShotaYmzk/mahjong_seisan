-- Fix: Room creation and joining requires reading rooms before being a member.
--
-- 1. Allow creator to SELECT their own rooms (for INSERT...RETURNING)
-- 2. Add RPC function for finding a room by passphrase (SECURITY DEFINER bypasses RLS)

-- Drop the old overly-strict rooms SELECT policy
DROP POLICY IF EXISTS "rooms_select_member" ON rooms;

-- New policy: members can see rooms, AND the creator can see their own rooms
CREATE POLICY "rooms_select_member_or_creator"
  ON rooms FOR SELECT
  USING (
    public.is_room_member(id) OR created_by = auth.uid()
  );

-- RPC function: find room by passphrase (returns room_id only, bypasses RLS)
CREATE OR REPLACE FUNCTION public.find_room_by_passphrase(p_passphrase text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM rooms WHERE passphrase = p_passphrase LIMIT 1;
$$;
