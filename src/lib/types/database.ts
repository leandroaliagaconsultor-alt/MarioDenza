import type {
  PropertyType,
  PropertyStatus,
  ContractStatus,
  CurrencyType,
  LegalFramework,
  PaymentStatus,
  PaymentMethod,
  IndexType,
  LateFeeType,
  DiscountType,
  EntityType,
  DocumentCategory,
  NotificationType,
  NotificationChannel,
} from "./enums";

// ========================================
// Base type for all tables
// ========================================

interface BaseRow {
  id: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// Owners (Propietarios)
// ========================================

export interface Owner extends BaseRow {
  full_name: string;
  dni_cuit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_info: Record<string, unknown>;
  notes: string | null;
}

export type OwnerInsert = Omit<Owner, "id" | "created_at" | "updated_at">;
export type OwnerUpdate = Partial<OwnerInsert>;

// ========================================
// Tenants (Inquilinos)
// ========================================

export interface Guarantor {
  full_name: string;
  dni: string;
  phone: string;
  address: string;
}

export interface Tenant extends BaseRow {
  full_name: string;
  dni: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  guarantors: Guarantor[];
}

export type TenantInsert = Omit<Tenant, "id" | "created_at" | "updated_at">;
export type TenantUpdate = Partial<TenantInsert>;

// ========================================
// Properties (Propiedades)
// ========================================

export interface Property extends BaseRow {
  address: string;
  unit: string | null;
  city: string | null;
  province: string | null;
  type: PropertyType;
  owner_id: string;
  status: PropertyStatus;
  notes: string | null;
}

export type PropertyInsert = Omit<Property, "id" | "created_at" | "updated_at">;
export type PropertyUpdate = Partial<PropertyInsert>;

// With relations
export interface PropertyWithOwner extends Property {
  owner: Owner;
}

// ========================================
// Contracts (Contratos)
// ========================================

export interface Contract extends BaseRow {
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  currency: CurrencyType;
  base_rent: number;
  current_rent: number;
  payment_day: number;
  legal_framework: LegalFramework;
  agency_collects: boolean;
  commission_percentage: number;
  late_fee_enabled: boolean;
  late_fee_type: LateFeeType | null;
  late_fee_value: number | null;
  status: ContractStatus;
  notes: string | null;
}

export type ContractInsert = Omit<Contract, "id" | "created_at" | "updated_at">;
export type ContractUpdate = Partial<ContractInsert>;

// With relations
export interface ContractWithRelations extends Contract {
  property: PropertyWithOwner;
  tenant: Tenant;
  contract_adjustments: ContractAdjustment[];
}

// ========================================
// Contract Adjustments (Config de aumentos)
// ========================================

export interface ContractAdjustment extends BaseRow {
  contract_id: string;
  index_type: IndexType;
  frequency_months: number;
  next_adjustment_date: string;
  fixed_percentage: number | null;
}

export type ContractAdjustmentInsert = Omit<ContractAdjustment, "id" | "created_at" | "updated_at">;

// ========================================
// Adjustment History (Historial de aumentos)
// ========================================

export interface AdjustmentHistory extends BaseRow {
  contract_id: string;
  applied_date: string;
  previous_rent: number;
  new_rent: number;
  index_type: IndexType;
  index_value_from: number | null;
  index_value_to: number | null;
  percentage_applied: number;
  applied_by: string | null;
  notification_sent_at: string | null;
}

export type AdjustmentHistoryInsert = Omit<AdjustmentHistory, "id" | "created_at" | "updated_at">;

// ========================================
// Payments (Pagos)
// ========================================

export interface Payment extends BaseRow {
  contract_id: string;
  period: string;
  due_date: string;
  paid_date: string | null;
  amount_due: number;
  amount_paid: number;
  discount_amount: number;
  late_fee_amount: number;
  commission_amount: number;
  owner_payout: number;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  receipt_pdf_url: string | null;
  notes: string | null;
}

export type PaymentInsert = Omit<Payment, "id" | "created_at" | "updated_at">;
export type PaymentUpdate = Partial<PaymentInsert>;

// With relations
export interface PaymentWithContract extends Payment {
  contract: ContractWithRelations;
}

// ========================================
// Discounts (Descuentos)
// ========================================

export interface Discount extends BaseRow {
  payment_id: string;
  type: DiscountType;
  value: number;
  reason: string | null;
}

export type DiscountInsert = Omit<Discount, "id" | "created_at" | "updated_at">;

// ========================================
// Documents (Documentos)
// ========================================

export interface Document extends BaseRow {
  entity_type: EntityType;
  entity_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  category: DocumentCategory;
}

export type DocumentInsert = Omit<Document, "id" | "created_at" | "updated_at">;

// ========================================
// Notifications Log
// ========================================

export interface NotificationLog extends BaseRow {
  type: NotificationType;
  contract_id: string | null;
  tenant_id: string | null;
  channel: NotificationChannel;
  message_preview: string | null;
  sent_at: string;
  triggered_by: string | null;
}

export type NotificationLogInsert = Omit<NotificationLog, "id" | "created_at" | "updated_at">;

// ========================================
// Index Cache
// ========================================

export interface IndexCache extends BaseRow {
  index_type: IndexType;
  period: string;
  value: number;
  fetched_at: string;
}

export type IndexCacheInsert = Omit<IndexCache, "id" | "created_at" | "updated_at">;
