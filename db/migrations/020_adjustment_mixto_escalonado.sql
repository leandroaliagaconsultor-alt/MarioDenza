-- Nuevos tipos de ajuste: "Mixto" (ponderado ICL/IPC) y "Escalonado" (tramos pactados).

-- 1) Valores nuevos en el enum index_type.
--    (Se corren por separado del uso porque ALTER TYPE ... ADD VALUE no puede usarse
--     en la misma transacción donde se referencia el valor nuevo.)
ALTER TYPE index_type ADD VALUE IF NOT EXISTS 'mixto';
ALTER TYPE index_type ADD VALUE IF NOT EXISTS 'escalonado';

-- 2) Columnas de configuración en contract_adjustments.
-- Mixto: peso (0-100) del ICL; el IPC es 100 - mix_weight_icl.
ALTER TABLE contract_adjustments ADD COLUMN IF NOT EXISTS mix_weight_icl numeric;
-- Escalonado: cronograma de tramos pactados [{ "date": "YYYY-MM-DD", "amount": 123456 }, ...].
ALTER TABLE contract_adjustments ADD COLUMN IF NOT EXISTS escalones jsonb;
