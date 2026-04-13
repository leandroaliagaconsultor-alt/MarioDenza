import { getCommissionsReport } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { ExportButton } from "../export-button";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  searchParams: Promise<{ year?: string }>;
}

export default async function ComisionesPage({ searchParams }: Props) {
  const { year: yearParam } = await searchParams;
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const data = await getCommissionsReport(year);

  const totalCommissions = data.reduce((s, p) => s + (p.commission_amount || 0), 0);
  const totalPaid = data.reduce((s, p) => s + (p.amount_paid || 0), 0);
  const totalPayout = data.reduce((s, p) => s + (p.owner_payout || 0), 0);

  const csvHeaders = ["Periodo", "Propiedad", "Inquilino", "Cobrado", "Comision", "Pago dueno"];
  const csvRows = data.map((p: any) => {
    const c = Array.isArray(p.contract) ? p.contract[0] : p.contract;
    const prop = Array.isArray(c?.property) ? c.property[0] : c?.property;
    const ten = Array.isArray(c?.tenant) ? c.tenant[0] : c?.tenant;
    return [p.period.substring(0, 7), prop?.address || "", ten?.full_name || "", String(p.amount_paid), String(p.commission_amount), String(p.owner_payout)];
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Comisiones" description={`Ano ${year}`} backHref="/reportes"
        action={<ExportButton headers={csvHeaders} rows={csvRows} filename={`comisiones-${year}.csv`} />} />

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Total cobrado</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Comisiones</p>
          <p className="mt-1 text-xl font-bold text-teal-600">{formatCurrency(totalCommissions)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Pago a duenos</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(totalPayout)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Periodo</th>
                <th className="px-6 py-3">Propiedad</th>
                <th className="px-6 py-3">Inquilino</th>
                <th className="px-6 py-3 text-right">Cobrado</th>
                <th className="px-6 py-3 text-right">Comision</th>
                <th className="px-6 py-3 text-right">Pago dueno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((p: any, i: number) => {
                const c = Array.isArray(p.contract) ? p.contract[0] : p.contract;
                const prop = Array.isArray(c?.property) ? c.property[0] : c?.property;
                const ten = Array.isArray(c?.tenant) ? c.tenant[0] : c?.tenant;
                return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-gray-500">{p.period.substring(0, 7)}</td>
                    <td className="px-6 py-3 font-medium">{prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}</td>
                    <td className="px-6 py-3 text-gray-600">{ten?.full_name}</td>
                    <td className="px-6 py-3 text-right">{formatCurrency(p.amount_paid)}</td>
                    <td className="px-6 py-3 text-right font-medium text-teal-600">{formatCurrency(p.commission_amount)}</td>
                    <td className="px-6 py-3 text-right">{formatCurrency(p.owner_payout)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
