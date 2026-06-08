import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { getContracts } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { CONTRACT_STATUSES, CONTRACT_STATUS_COLORS, CURRENCY_TYPES } from "@/lib/types/enums";
import type { ContractStatus, CurrencyType } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function ContratosPage({ searchParams }: Props) {
  const { q, status } = await searchParams;
  const contracts = await getContracts(q, status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Gestión de contratos de alquiler"
        action={
          <Link href="/contratos/nuevo">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" /> Nuevo contrato
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput placeholder="Buscar por propiedad o inquilino..." />
        <div className="flex gap-2">
          <Link href="/contratos">
            <Button variant={!status ? "default" : "outline"} size="sm" className={!status ? "bg-teal-600" : ""}>Todos</Button>
          </Link>
          {Object.entries(CONTRACT_STATUSES).map(([key, label]) => (
            <Link key={key} href={`/contratos?status=${key}${q ? `&q=${q}` : ""}`}>
              <Button variant={status === key ? "default" : "outline"} size="sm" className={status === key ? "bg-teal-600" : ""}>{label}</Button>
            </Link>
          ))}
        </div>
      </div>

      {contracts.length === 0 ? (
        <EmptyState icon={FileText} title={q || status ? "Sin resultados" : "Sin contratos"} description={q || status ? "No se encontraron contratos." : "Crea tu primer contrato."} />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Propiedad</th>
                  <th className="hidden px-6 py-3 md:table-cell">Inquilino</th>
                  <th className="px-6 py-3">Alquiler</th>
                  <th className="hidden px-6 py-3 lg:table-cell">Periodo</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.map((c) => {
                  const prop = c.property as { id: string; address: string; unit?: string } | null;
                  const ten = c.tenant as { id: string; full_name: string } | null;
                  return (
                    <tr key={c.id} className="relative transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <Link href={`/contratos/${c.id}`} className="font-medium text-gray-900 after:absolute after:inset-0 hover:text-teal-600">
                          {prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}
                        </Link>
                      </td>
                      <td className="hidden px-6 py-4 text-gray-600 md:table-cell">{ten?.full_name ?? "—"}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(c.current_rent, c.currency as CurrencyType)}
                      </td>
                      <td className="hidden px-6 py-4 text-gray-500 text-xs lg:table-cell">
                        {formatDate(c.start_date)} — {formatDate(c.end_date)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge label={CONTRACT_STATUSES[c.status as ContractStatus]} colorClass={CONTRACT_STATUS_COLORS[c.status as ContractStatus]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
