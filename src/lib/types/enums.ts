// Enums del sistema con labels en español para UI

export const PROPERTY_TYPES = {
  residencial: "Residencial",
  comercial: "Comercial",
  temporario: "Temporario",
  otro: "Otro",
} as const;
export type PropertyType = keyof typeof PROPERTY_TYPES;

export const PROPERTY_STATUSES = {
  ocupada: "Ocupada",
  disponible: "Disponible",
  en_mantenimiento: "En mantenimiento",
  retirada: "Retirada",
} as const;
export type PropertyStatus = keyof typeof PROPERTY_STATUSES;

export const CONTRACT_STATUSES = {
  activo: "Activo",
  finalizado: "Finalizado",
  rescindido: "Rescindido",
  por_vencer: "Por vencer",
} as const;
export type ContractStatus = keyof typeof CONTRACT_STATUSES;

export const CURRENCY_TYPES = {
  ARS: "Pesos (ARS)",
  USD: "Dolares (USD)",
} as const;
export type CurrencyType = keyof typeof CURRENCY_TYPES;

export const LEGAL_FRAMEWORKS = {
  ley_27551: "Ley 27.551",
  dnu_70_2023: "DNU 70/2023",
  ley_anterior: "Ley anterior",
  otro: "Otro",
} as const;
export type LegalFramework = keyof typeof LEGAL_FRAMEWORKS;

export const PAYMENT_STATUSES = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  parcial: "Parcial",
  vencido: "Vencido",
} as const;
export type PaymentStatus = keyof typeof PAYMENT_STATUSES;

export const PAYMENT_METHODS = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mp: "Mercado Pago",
  cheque: "Cheque",
  otro: "Otro",
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const INDEX_TYPES = {
  ICL: "ICL (BCRA)",
  IPC: "IPC (INDEC)",
  casa_propia: "Casa Propia",
  fixed_percentage: "Porcentaje fijo",
  custom: "Personalizado",
} as const;
export type IndexType = keyof typeof INDEX_TYPES;

export const LATE_FEE_TYPES = {
  percentage: "Porcentaje",
  fixed: "Monto fijo",
  daily_percentage: "Porcentaje diario",
} as const;
export type LateFeeType = keyof typeof LATE_FEE_TYPES;

export const DISCOUNT_TYPES = {
  fixed: "Monto fijo",
  percentage: "Porcentaje",
} as const;
export type DiscountType = keyof typeof DISCOUNT_TYPES;

export const ENTITY_TYPES = {
  property: "Propiedad",
  contract: "Contrato",
  tenant: "Inquilino",
  owner: "Propietario",
} as const;
export type EntityType = keyof typeof ENTITY_TYPES;

export const DOCUMENT_CATEGORIES = {
  contrato: "Contrato",
  dni: "DNI",
  garantia: "Garantia",
  recibo: "Recibo",
  foto: "Foto",
  otro: "Otro",
} as const;
export type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES;

export const NOTIFICATION_TYPES = {
  aumento: "Aumento",
  vencimiento_contrato: "Vencimiento de contrato",
  pago_vencido: "Pago vencido",
  manual: "Manual",
} as const;
export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export const NOTIFICATION_CHANNELS = {
  whatsapp_link: "WhatsApp",
  internal: "Interna",
} as const;
export type NotificationChannel = keyof typeof NOTIFICATION_CHANNELS;

// Colores para badges de status
export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  ocupada: "bg-blue-100 text-blue-700",
  disponible: "bg-green-100 text-green-700",
  en_mantenimiento: "bg-amber-100 text-amber-700",
  retirada: "bg-gray-100 text-gray-700",
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  activo: "bg-green-100 text-green-700",
  finalizado: "bg-gray-100 text-gray-700",
  rescindido: "bg-red-100 text-red-700",
  por_vencer: "bg-amber-100 text-amber-700",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  pagado: "bg-green-100 text-green-700",
  parcial: "bg-orange-100 text-orange-700",
  vencido: "bg-red-100 text-red-700",
};
