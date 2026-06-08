-- Soft-delete para entidades NO financieras: dueños, inquilinos y propiedades.
-- Un sistema que reemplaza el papel no debe perder registros: "eliminar" = archivar.
-- (Contratos y pagos NUNCA se borran: solo cambian de estado / se anulan.)

ALTER TABLE owners     ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tenants    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Índices parciales: las consultas filtran por deleted_at IS NULL (registros activos).
CREATE INDEX IF NOT EXISTS idx_owners_active     ON owners(deleted_at)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_active    ON tenants(deleted_at)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(deleted_at) WHERE deleted_at IS NULL;
