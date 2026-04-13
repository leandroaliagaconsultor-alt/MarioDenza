import { getOccupancyReport } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExportButton } from "../export-button";
import { PROPERTY_STATUSES, PROPERTY_STATUS_COLORS, PROPERTY_TYPES } from "@/lib/types/enums";
import type { PropertyStatus, PropertyType } from "@/lib/types/enums";

export default async function OcupacionPage() {
  const data = await getOccupancyReport();
  const occupied = data.filter((p) => p.status === "ocupada").length;
  const available = data.filter((p) => p.status === "disponible").length;
  const rate = data.length > 0 ? Math.round((occupied / data.length) * 100) : 0;

  const csvHeaders = ["Dirección", "Unidad", "Ciudad", "Tipo", "Estado", "Propietario"];
  const csvRows = data.map((p: any) => {
    const own = Array.isArray(p.owner) ? p.owner[0] : p.owner;
    return [p.address, p.unit || "", p.city || "", p.type, p.status, own?.full_name || ""];
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Ocupacion" description={`${rate}% ocupacion — ${occupied} ocupadas, ${available} disponibles de ${data.length} total`}
        backHref="/reportes" action={<ExportButton headers={csvHeaders} rows={csvRows} filename="ocupacion.csv" />} />

      <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Direccion</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Propietario</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((p: any, i: number) => {
                const own = Array.isArray(p.owner) ? p.owner[0] : p.owner;
                return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium">{p.address}{p.unit ? ` - ${p.unit}` : ""}<br/><span className="text-xs text-gray-400">{p.city}</span></td>
                    <td className="px-6 py-3 text-gray-500">{PROPERTY_TYPES[p.type as PropertyType]}</td>
                    <td className="px-6 py-3 text-gray-600">{own?.full_name || "—"}</td>
                    <td className="px-6 py-3"><StatusBadge label={PROPERTY_STATUSES[p.status as PropertyStatus]} colorClass={PROPERTY_STATUS_COLORS[p.status as PropertyStatus]} /></td>
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
