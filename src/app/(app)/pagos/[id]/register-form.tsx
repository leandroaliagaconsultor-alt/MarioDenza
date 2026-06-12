"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerPaymentSchema, type RegisterPaymentValues } from "@/lib/validators/payment";
import { registerPayment } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PAYMENT_METHODS } from "@/lib/types/enums";
import { formatCurrency } from "@/lib/utils/format";
import type { CurrencyType } from "@/lib/types/enums";
import { ExtrasFields } from "@/components/forms/extras-fields";
import type { PaymentExtra } from "@/lib/payments/extras";

interface Props {
  paymentId: string;
  rent: number; // alquiler del período (sin extras)
  currency: CurrencyType;
  suggestedLateFee?: number;
  initialExtras?: PaymentExtra[];
  alreadyPaid?: number; // ya pagado a cuenta (pagos parciales previos)
}

export function RegisterPaymentForm({ paymentId, rent, currency, suggestedLateFee = 0, initialExtras = [], alreadyPaid = 0 }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const initialTotal = rent + initialExtras.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const initialSaldo = Math.max(0, initialTotal - alreadyPaid);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<RegisterPaymentValues>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: {
      rent,
      amount_paid: initialSaldo, // por defecto cobra el saldo (o el total si no hay nada pagado)
      paid_date: today,
      payment_method: "efectivo",
      discount_amount: 0,
      discount_reason: "",
      late_fee_amount: suggestedLateFee,
      notes: "",
      extras: initialExtras,
    },
  });

  const watchedExtras = watch("extras");
  const watchedRent = watch("rent");
  const extrasSum = (watchedExtras ?? []).reduce((s, e) => s + (Number(e?.amount) || 0), 0);
  const total = (Number(watchedRent) || 0) + extrasSum;
  const saldoAntes = Math.max(0, total - alreadyPaid);

  // El "paga ahora" sigue al saldo restante; igual queda editable (puede pagar menos = a cuenta).
  useEffect(() => {
    setValue("amount_paid", saldoAntes);
  }, [saldoAntes, setValue]);

  const pagaAhora = Number(watch("amount_paid")) || 0;
  const saldoDespues = total - alreadyPaid - pagaAhora;

  async function onSubmit(values: RegisterPaymentValues) {
    setLoading(true);
    try {
      await registerPayment(paymentId, values);
      toast.success(saldoDespues > 0 ? "Pago a cuenta registrado" : "Pago registrado correctamente");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <CreditCard className="h-5 w-5 text-gray-400" />
          Registrar pago
        </h2>
        <Separator className="my-4" />

        {/* Desglose: alquiler + extras = total */}
        <div className="space-y-1.5 rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="rent" className="text-gray-600">Alquiler</Label>
            <Input
              id="rent"
              type="number"
              step="0.01"
              min={0}
              className="h-8 w-44 text-right"
              {...register("rent", {
                setValueAs: (v: unknown) => {
                  const n = Number(v);
                  return Number.isFinite(n) ? n : 0;
                },
              })}
            />
          </div>
          {(watchedExtras ?? []).map((e, i) =>
            e?.concept ? (
              <div key={i} className="flex items-center justify-between text-gray-500">
                <span>{e.concept}</span>
                <span>{formatCurrency(Number(e.amount) || 0, currency)}</span>
              </div>
            ) : null
          )}
          <Separator className="my-1.5" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Total a cobrar</span>
            <span className="text-base font-bold text-gray-900">{formatCurrency(total, currency)}</span>
          </div>
          {alreadyPaid > 0 && (
            <div className="flex items-center justify-between text-emerald-700">
              <span>Ya pagado a cuenta</span>
              <span>− {formatCurrency(alreadyPaid, currency)}</span>
            </div>
          )}
        </div>

        {/* Extras editables del mes */}
        <div className="mt-4">
          <ExtrasFields
            control={control}
            register={register}
            title="Extras del mes"
            hint="Editá el monto de cada extra para este pago (o agregá/sacá alguno). No se les aplica comisión: pasan al dueño."
          />
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="amount_paid">Monto que paga ahora *</Label>
            <Input id="amount_paid" type="number" step="0.01" {...register("amount_paid", { valueAsNumber: true })} className="mt-1" />
            {errors.amount_paid && <p className="mt-1 text-sm text-red-500">{errors.amount_paid.message}</p>}
            <p className={`mt-1 text-xs ${saldoDespues > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {saldoDespues > 0
                ? `Queda un saldo de ${formatCurrency(saldoDespues, currency)} (el mes sigue como "parcial").`
                : "Con este pago queda saldado el mes."}
            </p>
          </div>
          <div>
            <Label htmlFor="paid_date">Fecha de pago *</Label>
            <Input id="paid_date" type="date" {...register("paid_date")} className="mt-1" />
            {errors.paid_date && <p className="mt-1 text-sm text-red-500">{errors.paid_date.message}</p>}
          </div>
          <div>
            <Label htmlFor="payment_method">Metodo de pago</Label>
            <select id="payment_method" {...register("payment_method")} className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
              {Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="discount_amount">Descuento</Label>
            <Input id="discount_amount" type="number" step="0.01" min={0} {...register("discount_amount", { valueAsNumber: true })} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="discount_reason">Motivo del descuento</Label>
            <Input id="discount_reason" {...register("discount_reason")} className="mt-1" placeholder="Ej: arreglo de plomeria acordado" />
          </div>
          <div>
            <Label htmlFor="late_fee_amount">Recargo por mora</Label>
            <Input id="late_fee_amount" type="number" step="0.01" min={0} {...register("late_fee_amount", { valueAsNumber: true })} className="mt-1" />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" {...register("notes")} className="mt-1" placeholder="Observaciones..." rows={2} />
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saldoDespues > 0 ? "Registrar pago a cuenta" : "Registrar pago"}
          </Button>
        </div>
      </div>
    </form>
  );
}
