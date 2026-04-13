import Link from "next/link";
import { notFound } from "next/navigation";
import { getContractById, getContractPayments, getAdjustmentHistory } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, UserCheck, TrendingUp, CreditCard, Calendar } from "lucide-react";
import {
  CONTRACT_STATUSES, CONTRACT_STATUS_COLORS, CURRENCY_TYPES,
  LEGAL_FRAMEWORKS, INDEX_TYPES, PAYMENT_STATUSES, PAYMENT_STATUS_COLORS,
} from "@/lib/types/enums";
import type { ContractStatus, CurrencyType, PaymentStatus } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { ContractActions } from "./contract-actions";
import { AdjustmentPanel } from "./adjustment-panel";
import { WhatsAppButton } from "./whatsapp-button";
import { DocumentUpload } from "@/components/ui/document-upload";
import { getDocuments } from "@/lib/documents/actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContratoDetailPage({ params }: Props) {
  const { id } = await params;
  let contract;
  try { contract = await getContractById(id); } catch { notFound(); }

  const [payments, adjustments, documents] = await Promise.all([
    getContractPayments(id),
    getAdjustmentHistory(id),
    getDocuments("contract", id),
  ]);

  const propertyRaw = contract.property;
  const property = (Array.isArray(propertyRaw) ? propertyRaw[0] : propertyRaw) as { id: string; address: string; unit?: string; owner: { full_name: string } | { full_name: string }[] } | null;
  const tenantRaw = contract.tenant;
  const tenant = (Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw) as { id: string; full_name: string; phone?: string; email?: string } | null;
  const adjConfig = (contract.contract_adjustments as { index_type: string; frequency_months: number; next_adjustment_date: string; fixed_percentage?: number }[])?.[0];
  const currency = contract.currency as CurrencyType;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`${property?.address ?? "Contrato"}${property?.unit ? ` - ${property.unit}` : ""}`}
        description={`Contrato con ${tenant?.full_name ?? "—"}`}
        backHref="/contratos"
        action={
          <div className="flex items-center gap-2">
            <StatusBadge
              label={CONTRACT_STATUSES[contract.status as ContractStatus]}
              colorClass={CONTRACT_STATUS_COLORS[contract.status as ContractStatus]}
            />
            <Link href={`/contratos/${id}/historial`}>
              <Button variant="outline" size="sm">Timeline</Button>
            </Link>
            {(contract.status === "activo" || contract.status === "por_vencer") && (
              <ContractActions
                contractId={id}
                propertyId={contract.property_id}
                tenantId={contract.tenant_id}
                currentRent={contract.current_rent}
                currency={contract.currency}
                endDate={contract.end_date}
                adjustmentIndexType={adjConfig?.index_type}
                adjustmentFrequency={adjConfig?.frequency_months}
              />
            )}
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Alquiler actual</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(contract.current_rent, currency)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Comision</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{contract.commission_percentage}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Dia de pago</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{contract.payment_day}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Vencimiento</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatDate(contract.end_date)}</p>
        </div>
      </div>

      {/* Property & Tenant */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Building2 className="h-4 w-4 text-gray-400" /> Propiedad
          </h2>
          <Separator className="my-3" />
          {property && (
            <div>
              <Link href={`/propiedades/${property.id}`} className="font-medium text-gray-900 hover:text-teal-600">
                {property.address}{property.unit ? ` - ${property.unit}` : ""}
              </Link>
              <p className="mt-1 text-sm text-gray-500">Dueno: {property.owner?.full_name}</p>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <UserCheck className="h-4 w-4 text-gray-400" /> Inquilino
          </h2>
          <Separator className="my-3" />
          {tenant && (
            <div>
              <Link href={`/inquilinos/${tenant.id}`} className="font-medium text-gray-900 hover:text-teal-600">
                {tenant.full_name}
              </Link>
              <div className="mt-1 flex gap-3 text-sm text-gray-500">
                {tenant.phone && <span>{tenant.phone}</span>}
                {tenant.email && <span>{tenant.email}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contract details */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Calendar className="h-4 w-4 text-gray-400" /> Datos del contrato
        </h2>
        <Separator className="my-3" />
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-500">Inicio</dt>
            <dd className="mt-0.5 text-gray-900">{formatDate(contract.start_date)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Fin</dt>
            <dd className="mt-0.5 text-gray-900">{formatDate(contract.end_date)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Moneda</dt>
            <dd className="mt-0.5 text-gray-900">{CURRENCY_TYPES[currency]}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Alquiler inicial</dt>
            <dd className="mt-0.5 text-gray-900">{formatCurrency(contract.base_rent, currency)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Marco legal</dt>
            <dd className="mt-0.5 text-gray-900">{LEGAL_FRAMEWORKS[contract.legal_framework as keyof typeof LEGAL_FRAMEWORKS]}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Cobra inmobiliaria</dt>
            <dd className="mt-0.5 text-gray-900">{contract.agency_collects ? "Si" : "No"}</dd>
          </div>
        </dl>
      </div>

      {/* Adjustment config */}
      {adjConfig && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <TrendingUp className="h-4 w-4 text-gray-400" /> Aumentos programados
          </h2>
          <Separator className="my-3" />
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-gray-500">Indice</dt>
              <dd className="mt-0.5 text-gray-900">{INDEX_TYPES[adjConfig.index_type as keyof typeof INDEX_TYPES]}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Frecuencia</dt>
              <dd className="mt-0.5 text-gray-900">Cada {adjConfig.frequency_months} meses</dd>
            </div>
            <div>
              <dt className="text-gray-500">Proximo aumento</dt>
              <dd className="mt-0.5 font-medium text-teal-700">{formatDate(adjConfig.next_adjustment_date)}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Apply adjustment */}
      {adjConfig && contract.status === "activo" && (
        <AdjustmentPanel
          contractId={id}
          currency={currency}
          currentRent={contract.current_rent}
        />
      )}

      {/* WhatsApp */}
      {tenant?.phone && contract.status === "activo" && (
        <WhatsAppButton
          phone={tenant.phone}
          tenantName={tenant.full_name}
          propertyAddress={`${property?.address ?? ""}${property?.unit ? ` - ${property.unit}` : ""}`}
          currentRent={contract.current_rent}
          currency={currency}
          endDate={contract.end_date}
        />
      )}

      {/* Payments */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <CreditCard className="h-4 w-4 text-gray-400" /> Pagos ({payments.length})
        </h2>
        <Separator className="my-3" />
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400">Sin pagos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2 pr-4">Periodo</th>
                  <th className="pb-2 pr-4">Monto</th>
                  <th className="pb-2 pr-4">Pagado</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4 text-gray-900">{formatDate(p.period)}</td>
                    <td className="py-2 pr-4 text-gray-900">{formatCurrency(p.amount_due, currency)}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {p.paid_date ? formatDate(p.paid_date) : "—"}
                    </td>
                    <td className="py-2">
                      <StatusBadge
                        label={PAYMENT_STATUSES[p.status as PaymentStatus]}
                        colorClass={PAYMENT_STATUS_COLORS[p.status as PaymentStatus]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjustment history */}
      {adjustments.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <TrendingUp className="h-4 w-4 text-gray-400" /> Historial de aumentos
          </h2>
          <Separator className="my-3" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2 pr-4">Fecha</th>
                  <th className="pb-2 pr-4">Anterior</th>
                  <th className="pb-2 pr-4">Nuevo</th>
                  <th className="pb-2">Porcentaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {adjustments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-4 text-gray-900">{formatDate(a.applied_date)}</td>
                    <td className="py-2 pr-4 text-gray-600">{formatCurrency(a.previous_rent, currency)}</td>
                    <td className="py-2 pr-4 font-medium text-gray-900">{formatCurrency(a.new_rent, currency)}</td>
                    <td className="py-2 text-teal-700">+{a.percentage_applied}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Documents */}
      <DocumentUpload entityType="contract" entityId={id} documents={documents} />

      {contract.notes && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Notas</h2>
          <Separator className="my-3" />
          <p className="whitespace-pre-wrap text-sm text-gray-600">{contract.notes}</p>
        </div>
      )}
    </div>
  );
}
