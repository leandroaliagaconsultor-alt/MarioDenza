import { z } from "zod";

export const ownerFormSchema = z.object({
  full_name: z.string().min(1, "El nombre es obligatorio"),
  dni_cuit: z.string(),
  phone: z.string(),
  email: z.string().email("Email invalido").or(z.literal("")),
  address: z.string(),
  bank_info: z.object({
    cbu: z.string(),
    banco: z.string(),
    alias: z.string(),
  }),
  notes: z.string(),
});

export type OwnerFormValues = z.infer<typeof ownerFormSchema>;
