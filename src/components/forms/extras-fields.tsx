"use client";

import { useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

/**
 * Editor de extras (conceptos adicionales con nombre + monto opcional) para el contrato.
 * Recibe el `control` y `register` del form padre (sirve tanto en el wizard como en el form de edición).
 * El campo del form debe llamarse "extras" y ser un array de { concept, amount }.
 */
export function ExtrasFields({
  control,
  register,
  title = "Extras (expensas, ABL, cochera…)",
  hint = "Aparecen en cada pago con el monto editable. La comisión no se aplica sobre los extras: el monto pasa al dueño.",
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  title?: string;
  hint?: string;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "extras" });

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-700">{title}</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ concept: "", amount: 0 })}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Agregar extra
        </Button>
      </div>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>

      {fields.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-sm text-gray-400">
          Sin extras. (Opcional)
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Input placeholder="Concepto (ej. Expensas)" {...register(`extras.${i}.concept`)} />
              </div>
              <div className="w-40">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="Monto (opcional)"
                  {...register(`extras.${i}.amount`, {
                    setValueAs: (v: unknown) => {
                      const n = Number(v);
                      return Number.isFinite(n) ? n : 0;
                    },
                  })}
                />
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-0.5 text-gray-400 hover:text-red-600" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
