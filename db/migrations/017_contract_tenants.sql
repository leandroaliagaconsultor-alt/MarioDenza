-- Varios inquilinos por contrato (modelo: principal + co-inquilinos).
-- contracts.tenant_id se mantiene como el inquilino PRINCIPAL (contacto/WhatsApp/recibo).
-- contract_tenants guarda el conjunto completo de inquilinos del contrato.

CREATE TABLE IF NOT EXISTS contract_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_contract_tenant UNIQUE (contract_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_contract_tenants_contract ON contract_tenants(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_tenants_tenant ON contract_tenants(tenant_id);

-- Backfill: el inquilino actual de cada contrato pasa a ser el principal
INSERT INTO contract_tenants (contract_id, tenant_id, is_primary)
SELECT id, tenant_id, true FROM contracts
ON CONFLICT (contract_id, tenant_id) DO NOTHING;

-- RLS igual al resto (single-tenant, solo autenticados)
ALTER TABLE contract_tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated full access" ON contract_tenants;
CREATE POLICY "Authenticated full access" ON contract_tenants FOR ALL USING (auth.role() = 'authenticated');
