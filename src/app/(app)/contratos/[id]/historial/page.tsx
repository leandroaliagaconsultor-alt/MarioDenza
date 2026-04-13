import { notFound } from "next/navigation";
import { getContractById, getContractPayments, getAdjustmentHistory } from "../../actions";
import { getDocuments } from "../document-actions";
import { PageHeader } from "@/components/ui/page-header";
import { CreditCard, TrendingUp, FileText, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { PAYMENT_STATUSES, PAYMENT_STATUS_COLORS } from "@/lib/types/enums";
import type { CurrencyType, PaymentStatus } from "@/lib/types/enums";
import { StatusBadge } from "@/components/ui/status-badge";

interface Props {
  params: Promise<{ id: string }>;
}

type TimelineEvent = {
  date: string;
  type: "payment" | "adjustment" | "document" | "contract_start" | "contract_end";
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  badge?: { label: string; colorClass: string };
};

export default async function HistorialPage({ params }: Props) {
  const { id } = await params;
  let contract;
  try { contract = await getContractById(id); } catch { notFound(); }

  const [payments, adjustments, documents] = await Promise.all([
    getContractPayments(id),
    getAdjustmentHistory(id),
    getDocuments("contract", id),
  ]);

  const property = (Array.isArray(contract.property) ? contract.property[0] : contract.property) as { address: string; unit?: string } | null;
  const currency = contract.currency as CurrencyType;

  // Build timeline
  const events: TimelineEvent[] = [];

  // Contract start
  events.push({
    date: contract.start_date,
    type: "contract_start",
    title: "Inicio del contrato",
    subtitle: `Alquiler inicial: ${formatCurrency(contract.base_rent, currency)}`,
    icon: Calendar,
    color: "bg-blue-500",
  });

  // Payments
  for (const p of payments) {
    events.push({
      date: p.paid_date || p.due_date,
      type: "payment",
      title: `Pago ${p.period.substring(0, 7)}`,
      subtitle: p.status === "pagado"
        ? `${formatCurrency(p.amount_paid, currency)} — Comision: ${formatCurrency(p.commission_amount, currency)}`
        : `Pendiente: ${formatCurrency(p.amount_due, currency)}`,
      icon: CreditCard,
      color: p.status === "pagado" ? "bg-green-500" : p.status === "vencido" ? "bg-red-500" : "bg-yellow-500",
      badge: { label: PAYMENT_STATUSES[p.status as PaymentStatus], colorClass: PAYMENT_STATUS_COLORS[p.status as PaymentStatus] },
    });
  }

  // Adjustments
  for (const a of adjustments) {
    events.push({
      date: a.applied_date,
      type: "adjustment",
      title: `Aumento aplicado (+${a.percentage_applied}%)`,
      subtitle: `${formatCurrency(a.previous_rent, currency)} → ${formatCurrency(a.new_rent, currency)}`,
      icon: TrendingUp,
      color: "bg-teal-500",
    });
  }

  // Documents
  for (const d of documents) {
    events.push({
      date: d.created_at.split("T")[0],
      type: "document",
      title: `Documento: ${d.file_name}`,
      subtitle: d.category,
      icon: FileText,
      color: "bg-purple-500",
    });
  }

  // Contract end
  events.push({
    date: contract.end_date,
    type: "contract_end",
    title: "Fin del contrato",
    icon: Calendar,
    color: "bg-gray-400",
  });

  // Sort by date descending
  events.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Historial"
        description={`${property?.address ?? "Contrato"}${property?.unit ? ` - ${property.unit}` : ""}`}
        backHref={`/contratos/${id}`}
      />

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {events.map((event, i) => (
              <div key={i} className="relative flex gap-4 pl-2">
                {/* Dot */}
                <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${event.color} text-white`}>
                  <event.icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    {event.badge && (
                      <StatusBadge label={event.badge.label} colorClass={event.badge.colorClass} />
                    )}
                  </div>
                  {event.subtitle && (
                    <p className="mt-0.5 text-sm text-gray-500">{event.subtitle}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">{formatDate(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
