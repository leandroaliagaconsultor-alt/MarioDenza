-- Extras (conceptos adicionales con nombre + monto) en contratos y pagos.
-- En el contrato son la plantilla (recurrentes); en el pago son el snapshot editable del mes.
-- Forma: [{ "concept": "Expensas", "amount": 50000 }]. Default lista vacía (compatibilidad hacia atrás).
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE payments  ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '[]'::jsonb;
