-- ============================================================
-- Migration: Invite links (replace passphrase-based joining)
-- ============================================================

-- 1. Create invite_links table
CREATE TABLE invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  max_uses int NOT NULL DEFAULT 10,
  use_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invite_links_token ON invite_links (token);
CREATE INDEX idx_invite_links_room ON invite_links (room_id);

ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT/UPDATE/DELETE policies: all access via RPC only

-- 2. Drop passphrase from rooms
DROP INDEX IF EXISTS idx_rooms_passphrase;
ALTER TABLE rooms DROP COLUMN passphrase;

-- 3. Drop legacy functions and policies
DROP FUNCTION IF EXISTS public.find_room_by_passphrase(text);
DROP POLICY IF EXISTS "room_members_insert_authenticated" ON room_members;
DROP POLICY IF EXISTS "rooms_insert_authenticated" ON rooms;

-- ============================================================
-- RPC: create_room_with_invite(p_name, p_display_name)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_room_with_invite(
  p_name text,
  p_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_room_id uuid;
  v_token text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Create room
  INSERT INTO rooms (name, created_by)
  VALUES (p_name, v_user_id)
  RETURNING id INTO v_room_id;

  -- Add creator as member
  INSERT INTO room_members (room_id, user_id, display_name)
  VALUES (v_room_id, v_user_id, p_display_name);

  -- Generate invite token (2x gen_random_uuid, hyphens removed = 64 hex chars)
  v_token := replace(gen_random_uuid()::text, '-', '')
          || replace(gen_random_uuid()::text, '-', '');

  -- Create invite link (24h expiry)
  INSERT INTO invite_links (token, room_id, created_by, expires_at)
  VALUES (v_token, v_room_id, v_user_id, now() + interval '24 hours');

  RETURN jsonb_build_object('room_id', v_room_id, 'invite_token', v_token);
END;
$$;

-- ============================================================
-- RPC: join_room_via_invite(p_token, p_display_name)
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_room_via_invite(
  p_token text,
  p_display_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_room_id uuid;
  v_existing_member_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Look up the room for this token (without validating expiry yet)
  SELECT il.room_id INTO v_room_id
  FROM invite_links il
  WHERE il.token = p_token;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite link';
  END IF;

  -- Check if already a member (before touching use_count)
  SELECT id INTO v_existing_member_id
  FROM room_members
  WHERE room_id = v_room_id AND user_id = v_user_id;

  IF v_existing_member_id IS NOT NULL THEN
    -- Already a member: update display_name, don't increment use_count
    UPDATE room_members SET display_name = p_display_name
    WHERE id = v_existing_member_id;
    RETURN v_room_id;
  END IF;

  -- New member: atomically validate + increment use_count
  UPDATE invite_links
  SET use_count = use_count + 1
  WHERE token = p_token
    AND expires_at > now()
    AND use_count < max_uses
  RETURNING room_id INTO v_room_id;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite link';
  END IF;

  -- Insert new member (UPSERT for race-condition safety)
  INSERT INTO room_members (room_id, user_id, display_name)
  VALUES (v_room_id, v_user_id, p_display_name)
  ON CONFLICT (room_id, user_id) DO UPDATE SET display_name = EXCLUDED.display_name;

  RETURN v_room_id;
END;
$$;

-- ============================================================
-- RPC: create_invite_link(p_room_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_invite_link(p_room_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_token text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify caller is a member of this room
  IF NOT EXISTS (
    SELECT 1 FROM room_members WHERE room_id = p_room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this room';
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '')
          || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO invite_links (token, room_id, created_by, expires_at)
  VALUES (v_token, p_room_id, v_user_id, now() + interval '24 hours');

  RETURN v_token;
END;
$$;

-- ============================================================
-- GRANT EXECUTE to authenticated and anon roles
-- ============================================================
GRANT EXECUTE ON FUNCTION public.create_room_with_invite(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.join_room_via_invite(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_invite_link(uuid) TO authenticated, anon;
