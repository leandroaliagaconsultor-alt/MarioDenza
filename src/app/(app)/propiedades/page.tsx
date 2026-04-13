import Link from "next/link";
import { Building2, Plus, Eye, Pencil } from "lucide-react";
import { getProperties } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { PropiedadesDeleteButton } from "./delete-button";
import { PROPERTY_TYPES, PROPERTY_STATUSES, PROPERTY_STATUS_COLORS } from "@/lib/types/enums";
import type { PropertyStatus, PropertyType } from "@/lib/types/enums";

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function PropiedadesPage({ searchParams }: Props) {
  const { q, status } = await searchParams;
  const properties = await getProperties(q, status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propiedades"
        description="Gestión de propiedades de la inmobiliaria"
        action={
          <Link href="/propiedades/nuevo">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" /> Nueva propiedad
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput placeholder="Buscar por dirección, ciudad o dueño..." />
        <div className="flex gap-2">
          <Link href="/propiedades">
            <Button variant={!status ? "default" : "outline"} size="sm" className={!status ? "bg-teal-600" : ""}>Todas</Button>
          </Link>
          {Object.entries(PROPERTY_STATUSES).map(([key, label]) => (
            <Link key={key} href={`/propiedades?status=${key}${q ? `&q=${q}` : ""}`}>
              <Button variant={status === key ? "default" : "outline"} size="sm" className={status === key ? "bg-teal-600" : ""}>{label}</Button>
            </Link>
          ))}
        </div>
      </div>

      {properties.length === 0 ? (
        <EmptyState icon={Building2} title={q || status ? "Sin resultados" : "Sin propiedades"} description={q || status ? "No se encontraron propiedades." : "Agrega tu primera propiedad."} />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Direccion</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Propietario</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {properties.map((p) => {
                  const owner = p.owner as { id: string; full_name: string } | null;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <Link href={`/propiedades/${p.id}`} className="font-medium text-gray-900 hover:text-teal-600">
                          {p.address}{p.unit ? ` - ${p.unit}` : ""}
                        </Link>
                        {p.city && <p className="text-xs text-gray-400">{p.city}, {p.province}</p>}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{PROPERTY_TYPES[p.type as PropertyType]}</td>
                      <td className="px-6 py-4">
                        {owner ? (
                          <Link href={`/duenos/${owner.id}`} className="text-gray-600 hover:text-teal-600">{owner.full_name}</Link>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge label={PROPERTY_STATUSES[p.status as PropertyStatus]} colorClass={PROPERTY_STATUS_COLORS[p.status as PropertyStatus]} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/propiedades/${p.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link>
                          <Link href={`/propiedades/${p.id}/editar`}><Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button></Link>
                          <PropiedadesDeleteButton id={p.id} address={`${p.address}${p.unit ? ` - ${p.unit}` : ""}`} />
                        </div>
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
