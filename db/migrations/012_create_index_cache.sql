CREATE TABLE index_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_type index_type NOT NULL,
  period date NOT NULL,
  value numeric NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_index_period UNIQUE (index_type, period)
);
