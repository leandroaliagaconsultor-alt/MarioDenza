import { z } from "zod";

export const guarantorSchema = z.object({
  full_name: z.string().min(1, "Nombre obligatorio"),
  dni: z.string(),
  phone: z.string(),
  address: z.string(),
});

export const tenantFormSchema = z.object({
  full_name: z.string().min(1, "El nombre es obligatorio"),
  dni: z.string(),
  phone: z.string(),
  email: z.string().email("Email invalido").or(z.literal("")),
  notes: z.string(),
  guarantors: z.array(guarantorSchema),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;
