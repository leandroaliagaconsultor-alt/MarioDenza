import { z } from "zod";

export const contractFormSchema = z.object({
  // Step 1: Property
  property_id: z.string().uuid("Selecciona una propiedad"),

  // Step 2: Tenant
  tenant_id: z.string().uuid("Selecciona un inquilino"),

  // Step 3: Economic data
  start_date: z.string().min(1, "La fecha de inicio es obligatoria"),
  end_date: z.string().min(1, "La fecha de fin es obligatoria"),
  currency: z.enum(["ARS", "USD"]),
  base_rent: z.number().positive("El alquiler debe ser mayor a 0"),
  payment_day: z.number().int().min(1).max(31, "Dia entre 1 y 31"),
  legal_framework: z.enum(["ley_27551", "dnu_70_2023", "ley_anterior", "otro"]),
  agency_collects: z.boolean(),
  commission_percentage: z.number().min(0).max(100),
  late_fee_enabled: z.boolean(),
  late_fee_type: z.enum(["percentage", "fixed", "daily_percentage"]).nullable(),
  late_fee_value: z.number().nullable(),

  // Step 4: Adjustment config
  adjustment_index_type: z.enum(["ICL", "IPC", "casa_propia", "fixed_percentage", "custom"]).nullable(),
  adjustment_frequency_months: z.number().int().positive().nullable(),
  adjustment_next_date: z.string().nullable(),
  adjustment_fixed_percentage: z.number().nullable(),

  // Step 5: Notes
  notes: z.string(),
}).refine(
  (data) => !data.start_date || !data.end_date || data.end_date > data.start_date,
  { message: "La fecha de fin debe ser posterior a la fecha de inicio", path: ["end_date"] }
);

export type ContractFormValues = z.infer<typeof contractFormSchema>;

export const contractDefaults: ContractFormValues = {
  property_id: "",
  tenant_id: "",
  start_date: "",
  end_date: "",
  currency: "ARS",
  base_rent: 0,
  payment_day: 10,
  legal_framework: "dnu_70_2023",
  agency_collects: true,
  commission_percentage: 5,
  late_fee_enabled: false,
  late_fee_type: null,
  late_fee_value: null,
  adjustment_index_type: "ICL",
  adjustment_frequency_months: 3,
  adjustment_next_date: "",
  adjustment_fixed_percentage: null,
  notes: "",
};
