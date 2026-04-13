import Link from "next/link";
import { UserCheck, Plus, Phone, Mail, Eye, Pencil } from "lucide-react";
import { getTenants } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { InquilinosDeleteButton } from "./delete-button";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function InquilinosPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const tenants = await getTenants(q);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inquilinos"
        description="Gestion de inquilinos"
        action={
          <Link href="/inquilinos/nuevo">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" /> Nuevo inquilino
            </Button>
          </Link>
        }
      />
      <div className="flex items-center gap-4">
        <SearchInput placeholder="Buscar por nombre, DNI o email..." />
      </div>
      {tenants.length === 0 ? (
        <EmptyState icon={UserCheck} title={q ? "Sin resultados" : "Sin inquilinos"} description={q ? "No se encontraron inquilinos." : "Agrega tu primer inquilino."} />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">DNI</th>
                  <th className="px-6 py-3">Contacto</th>
                  <th className="px-6 py-3">Garantes</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tenants.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <Link href={`/inquilinos/${t.id}`} className="font-medium text-gray-900 hover:text-teal-600">{t.full_name}</Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{t.dni || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {t.phone && <span className="flex items-center gap-1.5 text-gray-500"><Phone className="h-3 w-3" /> {t.phone}</span>}
                        {t.email && <span className="flex items-center gap-1.5 text-gray-500"><Mail className="h-3 w-3" /> {t.email}</span>}
                        {!t.phone && !t.email && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{(t.guarantors as unknown[])?.length || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/inquilinos/${t.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link>
                        <Link href={`/inquilinos/${t.id}/editar`}><Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button></Link>
                        <InquilinosDeleteButton id={t.id} name={t.full_name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
