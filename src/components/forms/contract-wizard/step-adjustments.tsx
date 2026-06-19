"use client";

import { useFormContext } from "react-hook-form";
import type { ContractFormValues } from "@/lib/validators/contract";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AdjustmentFields } from "./adjustment-fields";

export function StepAdjustments() {
  const { register, watch, control } = useFormContext<ContractFormValues>();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Configuracion de aumentos</h3>
        <p className="mt-1 text-sm text-gray-500">Define como se ajustara el alquiler a lo largo del contrato.</p>
      </div>

      <AdjustmentFields register={register} watch={watch} control={control} />

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
