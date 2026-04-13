import { notFound } from "next/navigation";
import { getPaymentById } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { PAYMENT_STATUSES, PAYMENT_STATUS_COLORS, PAYMENT_METHODS } from "@/lib/types/enums";
import type { PaymentStatus, CurrencyType, PaymentMethod } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { RegisterPaymentForm } from "./register-form";
import Link from "next/link";
import { Building2, UserCheck, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppOverdueButton } from "./whatsapp-overdue";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: Props) {
  const { id } = await params;
  let payment;
  try { payment = await getPaymentById(id); } catch { notFound(); }

  const contractRaw = payment.contract;
  const contract = (Array.isArray(contractRaw) ? contractRaw[0] : contractRaw) as {
    id: string; currency: CurrencyType; commission_percentage: number; agency_collects: boolean;
    late_fee_enabled: boolean; late_fee_type: string | null; late_fee_value: number | null;
    property: { id: string; address: string; unit?: string } | null;
    tenant: { id: string; full_name: string; phone?: string } | null;
  } | null;
  const currency = (contract?.currency ?? "ARS") as CurrencyType;
  const isPending = payment.status === "pendiente" || payment.status === "vencido";

  // Calculate late fee if overdue
  let suggestedLateFee = 0;
  if (payment.status === "vencido" && contract?.late_fee_enabled && contract.late_fee_value) {
    const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)));
    if (contract.late_fee_type === "percentage") {
      suggestedLateFee = Math.round(payment.amount_due * (contract.late_fee_value / 100));
    } else if (contract.late_fee_type === "fixed") {
      suggestedLateFee = contract.late_fee_value;
    } else if (contract.late_fee_type === "daily_percentage") {
      suggestedLateFee = Math.round(payment.amount_due * (contract.late_fee_value / 100) * daysOverdue);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={`Pago ${payment.period.substring(0, 7)}`}
        description={`${contract?.property?.address ?? ""}${contract?.property?.unit ? ` - ${contract.property.unit}` : ""}`}
        backHref="/pagos"
        action={
          <div className="flex items-center gap-2">
            {isPending && contract?.tenant?.phone && (
              <WhatsAppOverdueButton
                phone={contract.tenant.phone}
                tenantName={contract.tenant.full_name ?? ""}
                propertyAddress={`${contract.property?.address ?? ""}${contract.property?.unit ? ` - ${contract.property.unit}` : ""}`}
                period={payment.period.substring(0, 7)}
                amount={String(payment.amount_due)}
                currency={contract.currency ?? "ARS"}
                dueDate={formatDate(payment.due_date)}
              />
            )}
            {!isPending && (
              <a href={`/api/receipt/${id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <FileDown className="mr-1 h-4 w-4" /> Recibo PDF
                </Button>
              </a>
            )}
            <StatusBadge
              label={PAYMENT_STATUSES[payment.status as PaymentStatus]}
              colorClass={PAYMENT_STATUS_COLORS[payment.status as PaymentStatus]}
            />
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Monto</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(payment.amount_due, currency)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Vencimiento</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatDate(payment.due_date)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Comision</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(payment.commission_amount, currency)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Pago al dueno</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(payment.owner_payout, currency)}</p>
        </div>
      </div>

      {/* Property & Tenant */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {contract?.property && (
          <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Building2 className="h-3.5 w-3.5" /> Propiedad
            </p>
            <Link href={`/propiedades/${contract.property.id}`} className="mt-1 block font-medium text-gray-900 hover:text-teal-600">
              {contract.property.address}{contract.property.unit ? ` - ${contract.property.unit}` : ""}
            </Link>
          </div>
        )}
        {contract?.tenant && (
          <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <UserCheck className="h-3.5 w-3.5" /> Inquilino
            </p>
            <Link href={`/inquilinos/${contract.tenant.id}`} className="mt-1 block font-medium text-gray-900 hover:text-teal-600">
              {contract.tenant.full_name}
            </Link>
          </div>
        )}
      </div>

      {/* Payment details if already paid */}
      {!isPending && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Detalle del pago</h2>
          <Separator className="my-3" />
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Monto pagado</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{formatCurrency(payment.amount_paid, currency)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Fecha de pago</dt>
              <dd className="mt-0.5 text-gray-900">{payment.paid_date ? formatDate(payment.paid_date) : "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Metodo</dt>
              <dd className="mt-0.5 text-gray-900">{payment.payment_method ? PAYMENT_METHODS[payment.payment_method as PaymentMethod] : "—"}</dd>
            </div>
            {payment.discount_amount > 0 && (
              <div>
                <dt className="text-gray-500">Descuento</dt>
                <dd className="mt-0.5 text-gray-900">-{formatCurrency(payment.discount_amount, currency)}</dd>
              </div>
            )}
            {payment.late_fee_amount > 0 && (
              <div>
                <dt className="text-gray-500">Recargo mora</dt>
                <dd className="mt-0.5 text-gray-900">+{formatCurrency(payment.late_fee_amount, currency)}</dd>
              </div>
            )}
          </dl>
          {payment.notes && (
            <>
              <Separator className="my-3" />
              <p className="whitespace-pre-wrap text-sm text-gray-600">{payment.notes}</p>
            </>
          )}
        </div>
      )}

      {/* Register payment form */}
      {isPending && (
        <RegisterPaymentForm
          paymentId={id}
          amountDue={payment.amount_due}
          currency={currency}
          suggestedLateFee={suggestedLateFee}
        />
      )}
    </div>
  );
}
