-- Add IPC reference field to contracts (for first adjustment calculation)
ALTER TABLE contracts ADD COLUMN ipc_referencia_inicial jsonb;
-- Format: {"period": "2025-09", "value": 49372.8}

-- Add manual override fields to adjustment_history
ALTER TABLE adjustment_history ADD COLUMN suggested_new_rent numeric;
ALTER TABLE adjustment_history ADD COLUMN manual_override boolean NOT NULL DEFAULT false;
ALTER TABLE adjustment_history ADD COLUMN override_reason text;
ALTER TABLE adjustment_history ADD COLUMN from_period text;
ALTER TABLE adjustment_history ADD COLUMN to_period text;
ALTER TABLE adjustment_history ADD COLUMN coefficient numeric;
ALTER TABLE adjustment_history ADD COLUMN months_covered integer;
