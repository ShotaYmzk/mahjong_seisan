-- Activity log: audit trail for dispute resolution
CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_session ON activity_log (session_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
