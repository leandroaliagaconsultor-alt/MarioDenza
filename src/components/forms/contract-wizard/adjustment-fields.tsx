"use client";

import { useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { INDEX_TYPES } from "@/lib/types/enums";

// Campos de configuración de aumentos. Se usa tanto en el alta (wizard) como en
// la edición de un contrato. `register/watch/control` se pasan como any para
// servir a los dos formularios (tipos distintos) sin pelear con los genéricos.
interface Props {
  register: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  watch: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  control: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function AdjustmentFields({ register, watch, control }: Props) {
  const indexType = watch("adjustment_index_type");
  const mixIcl = watch("adjustment_mix_weight_icl");

  const { fields, append, remove } = useFieldArray({ control, name: "adjustment_escalones" });

  const isEscalonado = indexType === "escalonado";
  const isMixto = indexType === "mixto";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="adjustment_index_type">Tipo de indice</Label>
          <select
            id="adjustment_index_type"
            {...register("adjustment_index_type")}
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">Sin aumentos programados</option>
            {Object.entries(INDEX_TYPES)
              .filter(([v]) => v !== "fixed_percentage")
              .map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
          </select>
        </div>

        {/* Frecuencia + próxima fecha: para todos menos escalonado (que usa los tramos) */}
        {indexType && !isEscalonado && (
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
          </>
        )}

        {indexType === "custom" && (
          <p className="text-xs text-gray-500 sm:col-span-2">
            "Otro / Manual": al aplicar el aumento te mostramos ICL, IPC y Casa Propia como referencia y vos decidís el monto final.
          </p>
        )}
      </div>

      {/* Mixto: ponderación ICL / IPC */}
      {isMixto && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <Label htmlFor="adjustment_mix_weight_icl">Ponderación del índice</Label>
          <p className="mt-0.5 text-xs text-gray-500">
            Cargá qué porcentaje pesa el ICL; el resto es IPC. El aumento se calcula como el promedio ponderado de ambos.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-32">
              <Label htmlFor="adjustment_mix_weight_icl" className="text-xs text-gray-500">ICL %</Label>
              <Input
                id="adjustment_mix_weight_icl"
                type="number"
                min={0}
                max={100}
                {...register("adjustment_mix_weight_icl", { valueAsNumber: true })}
                className="mt-1"
                placeholder="50"
              />
            </div>
            <div className="mt-5 text-sm text-gray-600">
              IPC: <span className="font-medium text-gray-900">{100 - (Number(mixIcl) || 0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Escalonado: tramos pactados */}
      {isEscalonado && (
        <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-4">
          <Label>Tramos pactados</Label>
          <p className="mt-0.5 text-xs text-gray-500">
            Cargá la fecha y el alquiler que rige desde esa fecha en cada tramo (el monto inicial va en "Datos económicos").
            Al llegar cada fecha el sistema te sugiere ese monto.
          </p>
          <div className="mt-3 space-y-2">
            {fields.length === 0 && (
              <p className="text-xs text-gray-400">Todavía no agregaste tramos.</p>
            )}
            {fields.map((field: { id: string }, i: number) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`escalon-date-${i}`} className="text-xs text-gray-500">Desde</Label>
                  <Input
                    id={`escalon-date-${i}`}
                    type="date"
                    {...register(`adjustment_escalones.${i}.date`)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`escalon-amount-${i}`} className="text-xs text-gray-500">Nuevo alquiler</Label>
                  <Input
                    id={`escalon-amount-${i}`}
                    type="number"
                    min={0}
                    {...register(`adjustment_escalones.${i}.amount`, { valueAsNumber: true })}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(i)}
                  className="mb-0.5 text-red-600 hover:bg-red-50"
                  title="Quitar tramo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ date: "", amount: 0 })}
            className="mt-3"
          >
            <Plus className="mr-1 h-4 w-4" /> Agregar tramo
          </Button>
        </div>
      )}
    </div>
  );
}
