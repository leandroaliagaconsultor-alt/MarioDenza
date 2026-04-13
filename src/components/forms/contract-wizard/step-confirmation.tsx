"use client";

import { useFormContext } from "react-hook-form";
import { useEffect, useState } from "react";
import type { ContractFormValues } from "@/lib/validators/contract";
import { Separator } from "@/components/ui/separator";
import { CURRENCY_TYPES, LEGAL_FRAMEWORKS, INDEX_TYPES } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { calculateRetroactive } from "@/app/(app)/contratos/actions";
import type { RetroactiveResult } from "@/lib/indices/retroactive-calculator";
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react";

interface Props {
  properties: { id: string; address: string; unit: string | null; owner: { full_name: string } | null }[];
  tenants: { id: string; full_name: string }[];
}

export function StepConfirmation({ properties, tenants }: Props) {
  const { watch, setValue } = useFormContext<ContractFormValues>();
  const values = watch();
  const [retroactive, setRetroactive] = useState<RetroactiveResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const property = properties.find((p) => p.id === values.property_id);
  const tenant = tenants.find((t) => t.id === values.tenant_id);

  const isOldContract = values.start_date && new Date(values.start_date) < new Date();
  const hasAdjustmentConfig = values.adjustment_index_type === "IPC" || values.adjustment_index_type === "ICL";

  useEffect(() => {
    if (!isOldContract || !hasAdjustmentConfig || !values.base_rent || !values.adjustment_frequency_months) return;

    setCalculating(true);
    calculateRetroactive(
      values.base_rent,
      values.start_date,
      values.adjustment_frequency_months,
      values.adjustment_index_type as "ICL" | "IPC"
    ).then((result) => {
      setRetroactive(result);
      // Store in form for createContract to use
      if (result.adjustments.length > 0) {
        (setValue as any)("retroactive_current_rent", result.currentRent);
        (setValue as any)("retroactive_adjustments", result.adjustments);
      }
    }).catch(() => {
      setRetroactive(null);
    }).finally(() => {
      setCalculating(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Revisa los datos antes de crear el contrato.</p>

      <div>
        <h3 className="text-sm font-semibold text-gray-700">Propiedad</h3>
        <p className="mt-1 text-sm text-gray-900">
          {property ? `${property.address}${property.unit ? ` - ${property.unit}` : ""}` : "—"}
        </p>
        {property?.owner && <p className="text-sm text-gray-500">Dueno: {property.owner.full_name}</p>}
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-gray-700">Inquilino</h3>
        <p className="mt-1 text-sm text-gray-900">{tenant?.full_name ?? "—"}</p>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-gray-700">Datos economicos</h3>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Periodo</dt>
            <dd className="text-gray-900">{values.start_date} al {values.end_date}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Alquiler inicial</dt>
            <dd className="text-gray-900">{formatCurrency(values.base_rent, values.currency)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Dia de pago</dt>
            <dd className="text-gray-900">{values.payment_day}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Marco legal</dt>
            <dd className="text-gray-900">{LEGAL_FRAMEWORKS[values.legal_framework]}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Comision</dt>
            <dd className="text-gray-900">{values.commission_percentage}%</dd>
          </div>
          <div>
            <dt className="text-gray-500">Cobra la inmobiliaria</dt>
            <dd className="text-gray-900">{values.agency_collects ? "Si" : "No"}</dd>
          </div>
        </dl>
      </div>

      {values.adjustment_index_type && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Aumentos</h3>
            <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Indice</dt>
                <dd className="text-gray-900">{INDEX_TYPES[values.adjustment_index_type]}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Frecuencia</dt>
                <dd className="text-gray-900">Cada {values.adjustment_frequency_months} meses</dd>
              </div>
              <div>
                <dt className="text-gray-500">Proximo aumento</dt>
                <dd className="text-gray-900">{values.adjustment_next_date || "—"}</dd>
              </div>
            </dl>
          </div>
        </>
      )}

      {/* Retroactive calculation */}
      {isOldContract && hasAdjustmentConfig && (
        <>
          <Separator />
          <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <TrendingUp className="h-4 w-4 text-teal-600" />
              Calculo retroactivo de aumentos
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              El contrato empieza en el pasado. Se calcularon los aumentos que deberian haberse aplicado.
            </p>

            {calculating ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Calculando...
              </div>
            ) : retroactive && retroactive.adjustments.length > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-xs font-medium uppercase text-gray-500">
                        <th className="pb-2 pr-3">#</th>
                        <th className="pb-2 pr-3">Fecha</th>
                        <th className="pb-2 pr-3">Indice</th>
                        <th className="pb-2 pr-3">Coef.</th>
                        <th className="pb-2 pr-3">%</th>
                        <th className="pb-2 pr-3">Antes</th>
                        <th className="pb-2">Despues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {retroactive.adjustments.map((adj) => (
                        <tr key={adj.adjustmentNumber}>
                          <td className="py-1.5 pr-3 text-gray-400">{adj.adjustmentNumber}</td>
                          <td className="py-1.5 pr-3 text-gray-700">{formatDate(adj.date)}</td>
                          <td className="py-1.5 pr-3 font-mono text-gray-500">{adj.fromPeriod}→{adj.toPeriod}</td>
                          <td className="py-1.5 pr-3 font-mono text-gray-700">{adj.coefficient.toFixed(4)}</td>
                          <td className="py-1.5 pr-3 text-teal-700">+{adj.percentage.toFixed(2)}%</td>
                          <td className="py-1.5 pr-3 text-gray-500">{formatCurrency(adj.rentBefore, values.currency)}</td>
                          <td className="py-1.5 font-medium text-gray-900">{formatCurrency(adj.rentAfter, values.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between rounded-md bg-teal-100 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-teal-700">Alquiler actual calculado</p>
                    <p className="text-xs text-teal-600">
                      {retroactive.adjustments.length} aumento{retroactive.adjustments.length > 1 ? "s" : ""} aplicado{retroactive.adjustments.length > 1 ? "s" : ""} — +{retroactive.totalPercentage.toFixed(1)}% total
                    </p>
                  </div>
                  <p className="text-xl font-bold text-teal-800">
                    {formatCurrency(retroactive.currentRent, values.currency)}
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  Al crear el contrato, el alquiler actual se guardara como {formatCurrency(retroactive.currentRent, values.currency)} y los {retroactive.adjustments.length} aumentos se registraran en el historial.
                </p>
              </div>
            ) : retroactive && retroactive.adjustments.length === 0 ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                No se encontraron valores del indice para calcular. Sincroniza los indices en Configuracion.
              </div>
            ) : null}
          </div>
        </>
      )}

      {values.notes && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Notas</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{values.notes}</p>
          </div>
        </>
      )}
    </div>
  );
}
