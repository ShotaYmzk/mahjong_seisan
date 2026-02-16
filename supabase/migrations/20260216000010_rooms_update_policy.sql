-- Allow room members to update room details (e.g. name)
CREATE POLICY "rooms_update_member"
  ON rooms FOR UPDATE
  USING (public.is_room_member(id))
  WITH CHECK (public.is_room_member(id));
