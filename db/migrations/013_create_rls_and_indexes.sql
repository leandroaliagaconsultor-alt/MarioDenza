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
