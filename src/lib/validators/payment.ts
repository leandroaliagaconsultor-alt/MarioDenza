import { z } from "zod";

export const registerPaymentSchema = z.object({
  amount_paid: z.number().positive("El monto debe ser mayor a 0"),
  paid_date: z.string().min(1, "La fecha de pago es obligatoria"),
  payment_method: z.enum(["efectivo", "transferencia", "mp", "cheque", "otro"]),
  discount_amount: z.number().min(0),
  discount_reason: z.string(),
  late_fee_amount: z.number().min(0),
  notes: z.string(),
});

export type RegisterPaymentValues = z.infer<typeof registerPaymentSchema>;
