"use client";

import { useFormContext } from "react-hook-form";
import type { ContractFormValues } from "@/lib/validators/contract";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { INDEX_TYPES } from "@/lib/types/enums";

export function StepAdjustments() {
  const { register, watch } = useFormContext<ContractFormValues>();
  const indexType = watch("adjustment_index_type");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Configuracion de aumentos</h3>
        <p className="mt-1 text-sm text-gray-500">Define como se ajustara el alquiler a lo largo del contrato.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="adjustment_index_type">Tipo de indice</Label>
          <select
            id="adjustment_index_type"
            {...register("adjustment_index_type")}
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">Sin aumentos programados</option>
            {Object.entries(INDEX_TYPES).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {indexType && (
          <>
            <div>
              <Label htmlFor="adjustment_frequency_months">Frecuencia (meses)</Label>
              <Input
                id="adjustment_frequency_months"
                type="number"
                min={1}
                {...register("adjustment_frequency_months", { valueAsNumber: true })}
                className="mt-1"
                placeholder="Ej: 3, 6, 12"
              />
            </div>

            <div>
              <Label htmlFor="adjustment_next_date">Proximo aumento</Label>
              <Input
                id="adjustment_next_date"
                type="date"
                {...register("adjustment_next_date")}
                className="mt-1"
              />
            </div>

            {indexType === "fixed_percentage" && (
              <div>
                <Label htmlFor="adjustment_fixed_percentage">Porcentaje fijo (%)</Label>
                <Input
                  id="adjustment_fixed_percentage"
                  type="number"
                  step="0.1"
                  {...register("adjustment_fixed_percentage", { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
            )}
          </>
        )}
      </div>

      <Separator />

      <div>
        <Label htmlFor="notes">Notas del contrato</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          className="mt-1"
          placeholder="Clausulas especiales, acuerdos verbales, etc..."
          rows={3}
        />
      </div>
    </div>
  );
}
