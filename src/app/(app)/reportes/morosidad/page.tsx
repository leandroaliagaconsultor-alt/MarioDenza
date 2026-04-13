import { getDelinquencyReport } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExportButton } from "../export-button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { PAYMENT_STATUSES, PAYMENT_STATUS_COLORS } from "@/lib/types/enums";
import type { PaymentStatus } from "@/lib/types/enums";

export default async function MorosidadPage() {
  const data = await getDelinquencyReport();
  const total = data.reduce((s, p) => s + (p.amount_due || 0), 0);

  const csvHeaders = ["Periodo", "Propiedad", "Inquilino", "Monto", "Vencimiento", "Estado"];
  const csvRows = data.map((p: any) => {
    const c = Array.isArray(p.contract) ? p.contract[0] : p.contract;
    const prop = Array.isArray(c?.property) ? c.property[0] : c?.property;
    const ten = Array.isArray(c?.tenant) ? c.tenant[0] : c?.tenant;
    return [p.period.substring(0, 7), prop?.address || "", ten?.full_name || "", String(p.amount_due), p.due_date, p.status];
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Morosidad" description={`Total adeudado: ${formatCurrency(total)}`} backHref="/reportes"
        action={<ExportButton headers={csvHeaders} rows={csvRows} filename="morosidad.csv" />} />

      <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Propiedad</th>
                <th className="px-6 py-3">Inquilino</th>
                <th className="px-6 py-3">Periodo</th>
                <th className="px-6 py-3 text-right">Monto</th>
                <th className="px-6 py-3">Vencimiento</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((p: any, i: number) => {
                const c = Array.isArray(p.contract) ? p.contract[0] : p.contract;
                const prop = Array.isArray(c?.property) ? c.property[0] : c?.property;
                const ten = Array.isArray(c?.tenant) ? c.tenant[0] : c?.tenant;
                return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium">{prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}</td>
                    <td className="px-6 py-3 text-gray-600">{ten?.full_name}</td>
                    <td className="px-6 py-3 text-gray-500">{p.period.substring(0, 7)}</td>
                    <td className="px-6 py-3 text-right font-medium text-red-600">{formatCurrency(p.amount_due)}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(p.due_date)}</td>
                    <td className="px-6 py-3"><StatusBadge label={PAYMENT_STATUSES[p.status as PaymentStatus]} colorClass={PAYMENT_STATUS_COLORS[p.status as PaymentStatus]} /></td>
                  </tr>
                );
              })}
              {data.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Sin morosidad</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
