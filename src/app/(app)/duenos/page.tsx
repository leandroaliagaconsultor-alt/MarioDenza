import Link from "next/link";
import { Users, Plus, Phone, Mail, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { getOwners } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DuenosDeleteButton } from "./delete-button";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function DuenosPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const owners = await getOwners(q);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duenos"
        description="Gestion de propietarios"
        action={
          <Link href="/duenos/nuevo">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo dueno
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-4">
        <SearchInput placeholder="Buscar por nombre, DNI o email..." />
      </div>

      {owners.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "Sin resultados" : "Sin duenos registrados"}
          description={
            q
              ? "No se encontraron duenos con esa busqueda."
              : "Agrega tu primer propietario para comenzar."
          }
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">DNI / CUIT</th>
                  <th className="px-6 py-3">Contacto</th>
                  <th className="px-6 py-3">Direccion</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {owners.map((owner) => (
                  <tr
                    key={owner.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/duenos/${owner.id}`}
                        className="font-medium text-gray-900 hover:text-teal-600"
                      >
                        {owner.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {owner.dni_cuit || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {owner.phone && (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="h-3 w-3" /> {owner.phone}
                          </span>
                        )}
                        {owner.email && (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Mail className="h-3 w-3" /> {owner.email}
                          </span>
                        )}
                        {!owner.phone && !owner.email && (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {owner.address || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/duenos/${owner.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/duenos/${owner.id}/editar`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DuenosDeleteButton id={owner.id} name={owner.full_name} />
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
