import { z } from "zod";

// Un extra: concepto + monto. El form garantiza que `amount` sea numérico (setValueAs → 0 si vacío).
export const extraSchema = z.object({
  concept: z.string(),
  amount: z.number().min(0),
});

export const extrasArraySchema = z.array(extraSchema);

export type ExtraInput = z.infer<typeof extraSchema>;
