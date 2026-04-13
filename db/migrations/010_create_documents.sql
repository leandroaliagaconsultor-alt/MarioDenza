CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL,
  entity_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  category document_category NOT NULL DEFAULT 'otro',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
