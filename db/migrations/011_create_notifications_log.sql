CREATE TABLE notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  channel notification_channel NOT NULL DEFAULT 'internal',
  message_preview text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  triggered_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
