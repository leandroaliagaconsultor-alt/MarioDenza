"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, TrendingUp, AlertCircle, Check, PenLine } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { calculatePendingAdjustment, applyAdjustment } from "./adjustment-actions";
import { formatCurrency } from "@/lib/utils/format";
import type { CurrencyType } from "@/lib/types/enums";
import type { AdjustmentCalculation } from "@/lib/indices/ipc-calculator";

interface Props {
  contractId: string;
  currency: CurrencyType;
  currentRent: number;
}

export function AdjustmentPanel({ contractId, currency, currentRent }: Props) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calc, setCalc] = useState<AdjustmentCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useOverride, setUseOverride] = useState(false);
  const [overrideRent, setOverrideRent] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState("");
  const router = useRouter();

  async function handleCalculate() {
    setCalculating(true);
    setError(null);
    try {
      const { data, error: calcError } = await calculatePendingAdjustment(contractId);
      if (calcError) {
        setError(calcError);
      } else {
        setCalc(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al calcular");
    } finally {
      setCalculating(false);
    }
  }

  async function handleApply() {
    if (!calc) return;

    if (useOverride) {
      if (!overrideRent || overrideRent <= 0) {
        toast.error("Ingresa el monto del override");
        return;
      }
      if (overrideReason.length < 10) {
        toast.error("El motivo del override debe tener al menos 10 caracteres");
        return;
      }
    }

    setLoading(true);
    try {
      const { error: applyError } = await applyAdjustment(
        contractId,
        calc,
        useOverride ? { finalRent: overrideRent, reason: overrideReason } : undefined
      );
      if (applyError) {
        toast.error(applyError);
      } else {
        toast.success("Aumento aplicado correctamente");
        setCalc(null);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aplicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <TrendingUp className="h-4 w-4 text-teal-600" /> Aplicar aumento por IPC
      </h2>
      <Separator className="my-3" />

      {!calc && !error ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Calcula el aumento usando el IPC publicado por el INDEC.
            El sistema toma como punto de partida el IPC de llegada del ajuste anterior
            (o la referencia inicial del contrato si es el primer ajuste).
          </p>
          <Button onClick={handleCalculate} disabled={calculating} className="bg-teal-600 hover:bg-teal-700">
            {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
            Calcular aumento
          </Button>
        </div>
      ) : error ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
          <Button variant="outline" onClick={() => { setError(null); setCalc(null); }}>Volver</Button>
        </div>
      ) : calc ? (
        <div className="space-y-5">
          {/* Full breakdown */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Check className="h-4 w-4" /> Calculo obtenido
            </div>

            <div className="mt-4 space-y-3 text-sm">
              {/* IPC values */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">IPC partida ({calc.fromPeriod})</p>
                  <p className="mt-0.5 font-mono text-lg font-bold text-gray-900">{calc.fromIndexValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">IPC llegada ({calc.toPeriod})</p>
                  <p className="mt-0.5 font-mono text-lg font-bold text-gray-900">{calc.toIndexValue.toFixed(2)}</p>
                </div>
              </div>

              <Separator />

              {/* Calculation details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Coeficiente</p>
                  <p className="mt-0.5 font-mono font-bold text-gray-900">{calc.coefficient.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Variacion</p>
                  <p className="mt-0.5 font-bold text-green-700">+{calc.percentage.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Meses IPC</p>
                  <p className="mt-0.5 font-bold text-gray-900">{calc.monthsCovered}</p>
                </div>
              </div>

              <Separator />

              {/* Rent result */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Alquiler actual</p>
                  <p className="mt-0.5 text-lg font-bold text-gray-900">{formatCurrency(calc.previousRent, currency)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Alquiler nuevo</p>
                  <p className="mt-0.5 text-lg font-bold text-green-700">{formatCurrency(calc.newRent, currency)}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Formula: {formatCurrency(calc.previousRent, currency)} × ({calc.toIndexValue.toFixed(2)} / {calc.fromIndexValue.toFixed(2)}) = {formatCurrency(calc.newRent, currency)}
              </p>
            </div>
          </div>

          {/* Manual override */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-override"
                checked={useOverride}
                onChange={(e) => setUseOverride(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor="use-override" className="flex cursor-pointer items-center gap-1.5 text-sm font-medium">
                <PenLine className="h-3.5 w-3.5" /> Usar monto manual (override)
              </Label>
            </div>

            {useOverride && (
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="override-rent">Monto final a aplicar</Label>
                  <Input
                    id="override-rent"
                    type="number"
                    value={overrideRent || ""}
                    onChange={(e) => setOverrideRent(Number(e.target.value))}
                    className="mt-1"
                    placeholder={String(calc.newRent)}
                  />
                </div>
                <div>
                  <Label htmlFor="override-reason">Motivo del override (minimo 10 caracteres)</Label>
                  <Textarea
                    id="override-reason"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="mt-1"
                    placeholder="Ej: Acuerdo con inquilino por reparaciones pendientes..."
                    rows={2}
                  />
                  {overrideReason.length > 0 && overrideReason.length < 10 && (
                    <p className="mt-1 text-xs text-red-500">{10 - overrideReason.length} caracteres mas</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleApply} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar ajuste
            </Button>
            <Button variant="outline" onClick={() => { setCalc(null); setUseOverride(false); setError(null); }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
