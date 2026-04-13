CREATE TABLE adjustment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  applied_date date NOT NULL,
  previous_rent numeric NOT NULL,
  new_rent numeric NOT NULL,
  index_type index_type NOT NULL,
  index_value_from numeric,
  index_value_to numeric,
  percentage_applied numeric NOT NULL,
  applied_by uuid REFERENCES auth.users(id),
  notification_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
