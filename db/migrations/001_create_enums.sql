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
