"use client";

import { useFormContext } from "react-hook-form";
import type { ContractFormValues } from "@/lib/validators/contract";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CURRENCY_TYPES, LEGAL_FRAMEWORKS, LATE_FEE_TYPES } from "@/lib/types/enums";

export function StepEconomic() {
  const { register, watch, formState: { errors } } = useFormContext<ContractFormValues>();
  const lateFeeEnabled = watch("late_fee_enabled");

  return (
    <div className="space-y-6">
      {/* Dates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Periodo del contrato</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="start_date">Fecha inicio *</Label>
            <Input id="start_date" type="date" {...register("start_date")} className="mt-1" />
            {errors.start_date && <p className="mt-1 text-sm text-red-500">{errors.start_date.message}</p>}
          </div>
          <div>
            <Label htmlFor="end_date">Fecha fin *</Label>
            <Input id="end_date" type="date" {...register("end_date")} className="mt-1" />
            {errors.end_date && <p className="mt-1 text-sm text-red-500">{errors.end_date.message}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Rent */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Alquiler</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="currency">Moneda</Label>
            <select id="currency" {...register("currency")} className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
              {Object.entries(CURRENCY_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="base_rent">Monto mensual *</Label>
            <Input id="base_rent" type="number" step="0.01" {...register("base_rent", { valueAsNumber: true })} className="mt-1" />
            {errors.base_rent && <p className="mt-1 text-sm text-red-500">{errors.base_rent.message}</p>}
          </div>
          <div>
            <Label htmlFor="payment_day">Dia de pago *</Label>
            <Input id="payment_day" type="number" min={1} max={31} {...register("payment_day", { valueAsNumber: true })} className="mt-1" />
            {errors.payment_day && <p className="mt-1 text-sm text-red-500">{errors.payment_day.message}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Legal & commission */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Marco legal y comision</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="legal_framework">Marco legal</Label>
            <select id="legal_framework" {...register("legal_framework")} className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
              {Object.entries(LEGAL_FRAMEWORKS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="commission_percentage">Comision (%)</Label>
            <Input id="commission_percentage" type="number" step="0.1" min={0} max={100} {...register("commission_percentage", { valueAsNumber: true })} className="mt-1" />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" id="agency_collects" {...register("agency_collects")} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            <Label htmlFor="agency_collects" className="cursor-pointer">La inmobiliaria cobra el alquiler</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Late fees */}
      <div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="late_fee_enabled" {...register("late_fee_enabled")} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <Label htmlFor="late_fee_enabled" className="cursor-pointer text-sm font-semibold text-gray-700">Intereses por mora</Label>
        </div>
        {lateFeeEnabled && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="late_fee_type">Tipo de interes</Label>
              <select id="late_fee_type" {...register("late_fee_type")} className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
                <option value="">Seleccionar...</option>
                {Object.entries(LATE_FEE_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="late_fee_value">Valor</Label>
              <Input id="late_fee_value" type="number" step="0.01" {...register("late_fee_value", { valueAsNumber: true })} className="mt-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
