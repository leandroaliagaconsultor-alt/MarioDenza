-- Seed data para desarrollo
-- Propietarios de ejemplo

INSERT INTO owners (id, full_name, dni_cuit, phone, email, address, bank_info) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Carlos Gonzalez', '20-28456789-3', '2324-401234', 'cgonzalez@email.com', 'Calle 25 N 450, Mercedes', '{"cbu": "0140000000000000001", "banco": "Provincia"}'),
  ('a1000000-0000-0000-0000-000000000002', 'Maria Rodriguez', '27-31234567-8', '2324-412345', 'mrodriguez@email.com', 'Av. 29 N 820, Mercedes', '{"cbu": "0170000000000000002", "banco": "Nacion"}'),
  ('a1000000-0000-0000-0000-000000000003', 'Jorge Fernandez', '20-25678901-5', '2324-423456', 'jfernandez@email.com', 'Calle 22 N 315, Mercedes', '{}'),
  ('a1000000-0000-0000-0000-000000000004', 'Ana Martinez', '27-33456789-1', '2324-434567', 'amartinez@email.com', 'Calle 28 N 1100, Mercedes', '{"cbu": "0110000000000000004", "banco": "Galicia"}'),
  ('a1000000-0000-0000-0000-000000000005', 'Roberto Lopez', '20-22345678-9', '2324-445678', NULL, 'Calle 30 N 560, Mercedes', '{}');

-- Inquilinos de ejemplo

INSERT INTO tenants (id, full_name, dni, phone, email, guarantors) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Lucas Perez', '35678901', '2324-501234', 'lperez@email.com', '[{"full_name": "Pedro Perez", "dni": "20567890", "phone": "2324-600001", "address": "Calle 15 N 200, Mercedes"}]'),
  ('b1000000-0000-0000-0000-000000000002', 'Sofia Garcia', '38901234', '2324-512345', 'sgarcia@email.com', '[]'),
  ('b1000000-0000-0000-0000-000000000003', 'Martin Diaz', '33456789', '2324-523456', 'mdiaz@email.com', '[{"full_name": "Luis Diaz", "dni": "18345678", "phone": "2324-600002", "address": "Calle 20 N 700, Mercedes"}]'),
  ('b1000000-0000-0000-0000-000000000004', 'Valentina Sanchez', '40123456', '2324-534567', NULL, '[]'),
  ('b1000000-0000-0000-0000-000000000005', 'Federico Ruiz', '36789012', '2324-545678', 'fruiz@email.com', '[]');

-- Propiedades de ejemplo

INSERT INTO properties (id, address, unit, city, province, type, owner_id, status) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Calle 25 N 450', NULL, 'Mercedes', 'Buenos Aires', 'residencial', 'a1000000-0000-0000-0000-000000000001', 'ocupada'),
  ('c1000000-0000-0000-0000-000000000002', 'Av. 29 N 820', 'Depto A', 'Mercedes', 'Buenos Aires', 'residencial', 'a1000000-0000-0000-0000-000000000002', 'ocupada'),
  ('c1000000-0000-0000-0000-000000000003', 'Av. 29 N 820', 'Depto B', 'Mercedes', 'Buenos Aires', 'residencial', 'a1000000-0000-0000-0000-000000000002', 'disponible'),
  ('c1000000-0000-0000-0000-000000000004', 'Calle 22 N 315', NULL, 'Mercedes', 'Buenos Aires', 'comercial', 'a1000000-0000-0000-0000-000000000003', 'ocupada'),
  ('c1000000-0000-0000-0000-000000000005', 'Calle 28 N 1100', NULL, 'Mercedes', 'Buenos Aires', 'residencial', 'a1000000-0000-0000-0000-000000000004', 'ocupada'),
  ('c1000000-0000-0000-0000-000000000006', 'Calle 30 N 560', 'PB', 'Mercedes', 'Buenos Aires', 'residencial', 'a1000000-0000-0000-0000-000000000005', 'disponible'),
  ('c1000000-0000-0000-0000-000000000007', 'Calle 30 N 560', '1er piso', 'Mercedes', 'Buenos Aires', 'residencial', 'a1000000-0000-0000-0000-000000000005', 'en_mantenimiento');

-- Contratos de ejemplo

INSERT INTO contracts (id, property_id, tenant_id, start_date, end_date, currency, base_rent, current_rent, payment_day, legal_framework, agency_collects, commission_percentage, status) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '2025-06-01', '2027-05-31', 'ARS', 180000, 250000, 10, 'dnu_70_2023', true, 5, 'activo'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', '2025-09-01', '2027-08-31', 'ARS', 150000, 200000, 5, 'dnu_70_2023', true, 5, 'activo'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', '2025-03-01', '2027-02-28', 'ARS', 350000, 450000, 1, 'dnu_70_2023', true, 4, 'activo'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', '2026-01-01', '2027-12-31', 'USD', 500, 500, 10, 'dnu_70_2023', false, 0, 'activo');

-- Configuracion de aumentos

INSERT INTO contract_adjustments (contract_id, index_type, frequency_months, next_adjustment_date) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'ICL', 3, '2026-06-01'),
  ('d1000000-0000-0000-0000-000000000002', 'ICL', 3, '2026-06-01'),
  ('d1000000-0000-0000-0000-000000000003', 'IPC', 6, '2026-09-01');

-- Pagos de ejemplo (Abril 2026)

INSERT INTO payments (contract_id, period, due_date, amount_due, amount_paid, commission_amount, owner_payout, status, payment_method, paid_date) VALUES
  ('d1000000-0000-0000-0000-000000000001', '2026-04-01', '2026-04-10', 250000, 250000, 12500, 237500, 'pagado', 'transferencia', '2026-04-09'),
  ('d1000000-0000-0000-0000-000000000002', '2026-04-01', '2026-04-05', 200000, 0, 0, 0, 'pendiente', NULL, NULL),
  ('d1000000-0000-0000-0000-000000000003', '2026-04-01', '2026-04-01', 450000, 450000, 18000, 432000, 'pagado', 'efectivo', '2026-04-01'),
  ('d1000000-0000-0000-0000-000000000004', '2026-04-01', '2026-04-10', 500, 0, 0, 0, 'pendiente', NULL, NULL);
