-- Liquidaciones a dueños: registro de cuándo se le pagó al propietario un período.
CREATE TABLE IF NOT EXISTS owner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
  period date NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_owner_period UNIQUE (owner_id, period)
);

CREATE INDEX IF NOT EXISTS idx_owner_payouts_owner ON owner_payouts(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_period ON owner_payouts(period);

ALTER TABLE owner_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated full access" ON owner_payouts;
CREATE POLICY "Authenticated full access" ON owner_payouts FOR ALL USING (auth.role() = 'authenticated');
