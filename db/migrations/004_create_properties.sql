CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  unit text,
  city text,
  province text DEFAULT 'Buenos Aires',
  type property_type NOT NULL DEFAULT 'residencial',
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
  status property_status NOT NULL DEFAULT 'disponible',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
