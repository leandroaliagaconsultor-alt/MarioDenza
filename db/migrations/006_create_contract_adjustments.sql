CREATE TABLE contract_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  index_type index_type NOT NULL,
  frequency_months integer NOT NULL CHECK (frequency_months > 0),
  next_adjustment_date date NOT NULL,
  fixed_percentage numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
