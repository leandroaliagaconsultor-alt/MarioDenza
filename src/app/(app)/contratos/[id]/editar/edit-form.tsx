"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateContract } from "../../actions";
import { LEGAL_FRAMEWORKS, LATE_FEE_TYPES } from "@/lib/types/enums";
import { ExtrasFields } from "@/components/forms/extras-fields";

interface FormValues {
  start_date: string;
  end_date: string;
  current_rent: number;
  payment_day: number;
  legal_framework: string;
  agency_collects: boolean;
  commission_percentage: number;
  late_fee_enabled: boolean;
  late_fee_type: string | null;
  late_fee_value: number | null;
  notes: string;
  extras: { concept: string; amount: number }[];
}

interface Props {
  contractId: string;
  defaultValues: FormValues;
}

export function ContractEditForm({ contractId, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, control } = useForm<FormValues>({
    defaultValues,
  });

  const lateFeeEnabled = watch("late_fee_enabled");

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await updateContract(contractId, values);
      toast.success("Contrato actualizado");
      router.push(`/contratos/${contractId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Periodo</h2>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Fecha inicio</Label>
            <Input type="date" {...register("start_date")} className="mt-1" />
          </div>
          <div>
            <Label>Fecha fin</Label>
            <Input type="date" {...register("end_date")} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Datos económicos</h2>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Alquiler actual</Label>
            <Input type="number" {...register("current_rent", { valueAsNumber: true })} className="mt-1" />
          </div>
          <div>
            <Label>Día de pago</Label>
            <Input type="number" min={1} max={31} {...register("payment_day", { valueAsNumber: true })} className="mt-1" />
          </div>
          <div>
            <Label>Marco legal</Label>
            <select
              value={watch("legal_framework")}
              onChange={(e) => setValue("legal_framework", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {Object.entries(LEGAL_FRAMEWORKS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label>Comisión (%)</Label>
            <Input type="number" step="0.1" min={0} max={100} {...register("commission_percentage", { valueAsNumber: true })} className="mt-1" />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" id="agency_collects" {...register("agency_collects")} className="h-4 w-4 rounded border-gray-300 text-teal-600" />
            <Label htmlFor="agency_collects" className="cursor-pointer">La inmobiliaria cobra el alquiler</Label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="late_fee_enabled" {...register("late_fee_enabled")} className="h-4 w-4 rounded border-gray-300 text-teal-600" />
          <Label htmlFor="late_fee_enabled" className="cursor-pointer text-lg font-semibold text-gray-900">Intereses por mora</Label>
        </div>
        {lateFeeEnabled && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Tipo de interés</Label>
                <select
                  value={watch("late_fee_type") ?? ""}
                  onChange={(e) => setValue("late_fee_type", e.target.value || null)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Seleccionar...</option>
                  {Object.entries(LATE_FEE_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" {...register("late_fee_value", { valueAsNumber: true })} className="mt-1" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <ExtrasFields control={control} register={register} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
        <Separator className="my-4" />
        <Textarea {...register("notes")} rows={3} placeholder="Observaciones..." />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
