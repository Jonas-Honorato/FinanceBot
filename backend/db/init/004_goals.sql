CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE NOT NULL,
  monthly_required_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_via VARCHAR(30) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status, deadline);
