"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, TrendingUp, AlertCircle, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { calculatePendingAdjustment, applyAdjustment, type AdjustmentCalcResult } from "./adjustment-actions";
import { formatCurrency } from "@/lib/utils/format";
import { formatPeriodShort } from "@/lib/indices/manual-adjustment";
import { INDEX_TYPES } from "@/lib/types/enums";
import type { CurrencyType } from "@/lib/types/enums";

interface Props {
  contractId: string;
  currency: CurrencyType;
  currentRent: number;
}

export function AdjustmentPanel({ contractId, currency, currentRent }: Props) {
  const [calculating, setCalculating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<AdjustmentCalcResult | null>(null);
  const [finalRent, setFinalRent] = useState<string>("");
  const [note, setNote] = useState("");
  const router = useRouter();

  const indexLabel = (t: string) => INDEX_TYPES[t as keyof typeof INDEX_TYPES] ?? t;

  async function handleCalculate() {
    setCalculating(true);
    try {
      const res = await calculatePendingAdjustment(contractId);
      setResult(res);
      if (res.kind === "ok") setFinalRent(String(res.calc.suggestedNewRent));
      else if (res.kind === "reference") setFinalRent("");
    } catch (err) {
      setResult({ kind: "error", message: err instanceof Error ? err.message : "Error al calcular" });
    } finally {
      setCalculating(false);
    }
  }

  async function handleApply() {
    if (!result || (result.kind !== "ok" && result.kind !== "reference")) return;
    const amount = Number(finalRent);
    if (!amount || amount <= 0) { toast.error("Ingresá el nuevo monto del alquiler"); return; }

    const calc = result.kind === "ok" ? result.calc : null;
    const indexType = result.kind === "ok" ? result.calc.indexType : result.indexType;
    setApplying(true);
    try {
      const { error } = await applyAdjustment(contractId, {
        finalRent: amount,
        indexType,
        suggestedNewRent: calc?.suggestedNewRent ?? null,
        coefficient: calc?.coefficient ?? null,
        percentage: calc?.percentage ?? null,
        fromPeriod: calc?.fromPeriod ?? null,
        toPeriod: calc?.toPeriod ?? null,
        monthsCovered: calc?.monthsCovered ?? null,
        note,
      });
      if (error) { toast.error(error); return; }
      toast.success("Aumento aplicado");
      setResult(null);
      setFinalRent("");
      setNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aplicar");
    } finally {
      setApplying(false);
    }
  }

  function reset() {
    setResult(null);
    setFinalRent("");
    setNote("");
  }

  const calc = result?.kind === "ok" ? result.calc : null;
  const resultIndexType =
    result?.kind === "ok" ? result.calc.indexType : result?.kind === "reference" ? result.indexType : "";
  const amount = Number(finalRent);
  const overridden = calc != null && amount > 0 && amount !== calc.suggestedNewRent;

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <TrendingUp className="h-4 w-4 text-teal-600" /> Aumento sugerido por índice
      </h2>
      <Separator className="my-3" />

      {/* Estado inicial */}
      {!result && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Calcula el aumento sugerido componiendo los índices cargados (ICL / IPC / Casa Propia) de los
            meses del ciclo. El monto final lo decidís vos antes de aplicar.
          </p>
          <Button onClick={handleCalculate} disabled={calculating} className="bg-teal-600 hover:bg-teal-700">
            {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
            Calcular sugerido
          </Button>
        </div>
      )}

      {/* Error */}
      {result?.kind === "error" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{result.message}</span>
          </div>
          <Button variant="outline" onClick={reset}>Volver</Button>
        </div>
      )}

      {/* Faltan índices */}
      {result?.kind === "needs_index" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Para sugerir el aumento por <span className="font-medium">{indexLabel(result.indexType)}</span> faltan
              cargar estos meses: <span className="font-medium">{result.missing.map(formatPeriodShort).join(", ")}</span>.
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/configuracion/indices" className="text-sm font-medium text-teal-600 hover:text-teal-700">
              Cargar índices →
            </Link>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">Volver</button>
          </div>
        </div>
      )}

      {/* Cálculo OK o referencias (Otro / Manual) */}
      {(result?.kind === "ok" || result?.kind === "reference") && (
        <div className="space-y-5">
          {calc ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <Check className="h-4 w-4" /> Sugerido por {indexLabel(calc.indexType)} ({calc.monthsCovered} meses)
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {calc.months.map((m) => (
                  <span key={m.period} className="rounded-full bg-white px-2.5 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">
                    {formatPeriodShort(m.period)}: <span className="font-medium text-gray-900">+{((m.factor - 1) * 100).toFixed(1)}%</span>
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Coeficiente</p>
                  <p className="mt-0.5 font-mono font-bold text-gray-900">{calc.coefficient.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Variación</p>
                  <p className="mt-0.5 font-bold text-green-700">+{calc.percentage.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Monto sugerido</p>
                  <p className="mt-0.5 font-bold text-gray-900">{formatCurrency(calc.suggestedNewRent, currency)}</p>
                </div>
              </div>
            </div>
          ) : result?.kind === "reference" ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <TrendingUp className="h-4 w-4" /> Referencia — cómo quedaría con cada índice
              </div>
              <p className="mt-1 text-xs text-blue-700/80">
                Este contrato es <span className="font-medium">{indexLabel(resultIndexType)}</span>: no se aplica un índice
                automático. Mirá las referencias y decidí el monto (o tipeá el tuyo).
              </p>

              {result.periods.length > 0 ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.periods.map((p) => (
                      <span key={p} className="rounded-full bg-white px-2.5 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">
                        {formatPeriodShort(p)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    {result.references.map((ref) => (
                      <div key={ref.indexType} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-gray-200">
                        <span className="text-sm font-medium text-gray-700">{indexLabel(ref.indexType)}</span>
                        {ref.calc ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">+{ref.calc.percentage.toFixed(2)}%</span>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(ref.calc.suggestedNewRent, currency)}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setFinalRent(String(ref.calc!.suggestedNewRent))}
                            >
                              Usar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-right text-xs text-amber-600">
                            Faltan meses: {ref.missing.map(formatPeriodShort).join(", ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs text-amber-700">
                  Este contrato no tiene ciclo de ajuste configurado: ingresá el monto a mano.
                </p>
              )}
            </div>
          ) : null}

          {/* Monto final editable */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="final-rent">Nuevo alquiler a aplicar</Label>
                <Input
                  id="final-rent"
                  type="number"
                  value={finalRent}
                  onChange={(e) => setFinalRent(e.target.value)}
                  className="mt-1"
                  placeholder={calc ? String(calc.suggestedNewRent) : "0"}
                  autoFocus
                />
              </div>
              {calc && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFinalRent(String(calc.suggestedNewRent))}
                  className="mb-0.5"
                  title="Usar el sugerido"
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Sugerido
                </Button>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Alquiler actual: <span className="font-medium text-gray-700">{formatCurrency(currentRent, currency)}</span>
              {calc && <> · Sugerido: <span className="font-medium text-gray-700">{formatCurrency(calc.suggestedNewRent, currency)}</span></>}
            </div>

            {overridden && (
              <div className="mt-3">
                <Label htmlFor="note">Motivo (opcional — quedó distinto al sugerido)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1"
                  placeholder="Ej: acuerdo con el dueño, no se aplicó el índice completo…"
                  rows={2}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleApply} disabled={applying} className="bg-teal-600 hover:bg-teal-700">
              {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aplicar aumento
            </Button>
            <Button variant="outline" onClick={reset} disabled={applying}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
