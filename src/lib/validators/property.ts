import { z } from "zod";

export const propertyFormSchema = z.object({
  address: z.string().min(1, "La direccion es obligatoria"),
  unit: z.string(),
  city: z.string(),
  province: z.string(),
  type: z.enum(["residencial", "comercial", "temporario", "otro"]),
  owner_id: z.string().uuid("Selecciona un propietario"),
  status: z.enum(["ocupada", "disponible", "en_mantenimiento", "retirada"]),
  notes: z.string(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
