-- Enums para el sistema de gestion inmobiliaria

CREATE TYPE property_type AS ENUM ('residencial', 'comercial', 'temporario', 'otro');
CREATE TYPE property_status AS ENUM ('ocupada', 'disponible', 'en_mantenimiento', 'retirada');
CREATE TYPE contract_status AS ENUM ('activo', 'finalizado', 'rescindido', 'por_vencer');
CREATE TYPE currency_type AS ENUM ('ARS', 'USD');
CREATE TYPE legal_framework AS ENUM ('ley_27551', 'dnu_70_2023', 'ley_anterior', 'otro');
CREATE TYPE payment_status AS ENUM ('pendiente', 'pagado', 'parcial', 'vencido');
CREATE TYPE payment_method AS ENUM ('efectivo', 'transferencia', 'mp', 'cheque', 'otro');
CREATE TYPE index_type AS ENUM ('ICL', 'IPC', 'casa_propia', 'fixed_percentage', 'custom');
CREATE TYPE late_fee_type AS ENUM ('percentage', 'fixed', 'daily_percentage');
CREATE TYPE discount_type AS ENUM ('fixed', 'percentage');
CREATE TYPE entity_type AS ENUM ('property', 'contract', 'tenant', 'owner');
CREATE TYPE document_category AS ENUM ('contrato', 'dni', 'garantia', 'recibo', 'foto', 'otro');
CREATE TYPE notification_type AS ENUM ('aumento', 'vencimiento_contrato', 'pago_vencido', 'manual');
CREATE TYPE notification_channel AS ENUM ('whatsapp_link', 'internal');
CREATE TABLE owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  dni_cuit text,
  phone text,
  email text,
  address text,
  bank_info jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  dni text,
  phone text,
  email text,
  notes text,
  guarantors jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
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
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  currency currency_type NOT NULL DEFAULT 'ARS',
  base_rent numeric NOT NULL,
  current_rent numeric NOT NULL,
  payment_day integer NOT NULL CHECK (payment_day BETWEEN 1 AND 31),
  legal_framework legal_framework NOT NULL DEFAULT 'dnu_70_2023',
  agency_collects boolean NOT NULL DEFAULT true,
  commission_percentage numeric NOT NULL DEFAULT 0,
  late_fee_enabled boolean NOT NULL DEFAULT false,
  late_fee_type late_fee_type,
  late_fee_value numeric,
  status contract_status NOT NULL DEFAULT 'activo',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_rent CHECK (base_rent > 0 AND current_rent > 0),
  CONSTRAINT valid_commission CHECK (commission_percentage >= 0 AND commission_percentage <= 100)
);
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
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  period date NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  amount_due numeric NOT NULL CHECK (amount_due >= 0),
  amount_paid numeric DEFAULT 0 CHECK (amount_paid >= 0),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  late_fee_amount numeric DEFAULT 0 CHECK (late_fee_amount >= 0),
  commission_amount numeric DEFAULT 0 CHECK (commission_amount >= 0),
  owner_payout numeric DEFAULT 0 CHECK (owner_payout >= 0),
  status payment_status NOT NULL DEFAULT 'pendiente',
  payment_method payment_method,
  receipt_pdf_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_contract_period UNIQUE (contract_id, period)
);
CREATE TABLE discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  type discount_type NOT NULL,
  value numeric NOT NULL CHECK (value > 0),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
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
-- ========================================
-- RLS Policies (single-tenant, authenticated only)
-- ========================================

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjustment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE index_cache ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can do everything (single-tenant v1)
CREATE POLICY "Authenticated full access" ON owners FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON tenants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON properties FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON contracts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON contract_adjustments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON adjustment_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON discounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON notifications_log FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON index_cache FOR ALL USING (auth.role() = 'authenticated');

-- ========================================
-- Indexes
-- ========================================

-- Properties
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_address ON properties USING gin(to_tsvector('spanish', address));

-- Contracts
CREATE INDEX idx_contracts_property_id ON contracts(property_id);
CREATE INDEX idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);

-- Contract adjustments
CREATE INDEX idx_contract_adjustments_contract_id ON contract_adjustments(contract_id);
CREATE INDEX idx_contract_adjustments_next_date ON contract_adjustments(next_adjustment_date);

-- Adjustment history
CREATE INDEX idx_adjustment_history_contract_id ON adjustment_history(contract_id);

-- Payments
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_period ON payments(period);
CREATE INDEX idx_payments_due_date ON payments(due_date);

-- Documents
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);

-- Notifications
CREATE INDEX idx_notifications_contract_id ON notifications_log(contract_id);
CREATE INDEX idx_notifications_type ON notifications_log(type);

-- Index cache
CREATE INDEX idx_index_cache_lookup ON index_cache(index_type, period);

-- ========================================
-- Updated_at trigger
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contract_adjustments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON adjustment_history FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON notifications_log FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON index_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at();
