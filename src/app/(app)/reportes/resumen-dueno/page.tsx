import { getOwnerSummary } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { ExportButton } from "../export-button";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  searchParams: Promise<{ year?: string }>;
}

export default async function ResumenDuenoPage({ searchParams }: Props) {
  const { year: yearParam } = await searchParams;
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const data = await getOwnerSummary(year);

  // Group by owner
  const byOwner: Record<string, { name: string; total: number; commission: number; payout: number; count: number }> = {};
  for (const p of data) {
    const c = Array.isArray(p.contract) ? p.contract[0] : p.contract as any;
    const prop = Array.isArray(c?.property) ? c.property[0] : c?.property;
    const own = Array.isArray(prop?.owner) ? prop.owner[0] : prop?.owner;
    if (!own) continue;
    if (!byOwner[own.id]) byOwner[own.id] = { name: own.full_name, total: 0, commission: 0, payout: 0, count: 0 };
    byOwner[own.id].total += p.amount_paid || 0;
    byOwner[own.id].commission += p.commission_amount || 0;
    byOwner[own.id].payout += p.owner_payout || 0;
    byOwner[own.id].count++;
  }

  const owners = Object.values(byOwner).sort((a, b) => b.payout - a.payout);
  const csvHeaders = ["Propietario", "Pagos", "Total cobrado", "Comision", "Liquidado"];
  const csvRows = owners.map((o) => [o.name, String(o.count), String(o.total), String(o.commission), String(o.payout)]);

  return (
    <div className="space-y-6">
      <PageHeader title="Resumen por dueño" description={`Ano ${year}`} backHref="/reportes"
        action={<ExportButton headers={csvHeaders} rows={csvRows} filename={`resumen-duenos-${year}.csv`} />} />

      <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Propietario</th>
                <th className="px-6 py-3 text-right">Pagos</th>
                <th className="px-6 py-3 text-right">Total cobrado</th>
                <th className="px-6 py-3 text-right">Comision</th>
                <th className="px-6 py-3 text-right">Liquidado al dueño</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {owners.map((o, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-gray-900">{o.name}</td>
                  <td className="px-6 py-3 text-right text-gray-500">{o.count}</td>
                  <td className="px-6 py-3 text-right">{formatCurrency(o.total)}</td>
                  <td className="px-6 py-3 text-right text-teal-600">{formatCurrency(o.commission)}</td>
                  <td className="px-6 py-3 text-right font-medium">{formatCurrency(o.payout)}</td>
                </tr>
              ))}
              {owners.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Sin datos para este periodo</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
