import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyById } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PropiedadesDeleteButton } from "../delete-button";
import { Pencil, MapPin, User } from "lucide-react";
import { PROPERTY_TYPES, PROPERTY_STATUSES, PROPERTY_STATUS_COLORS } from "@/lib/types/enums";
import type { PropertyType, PropertyStatus } from "@/lib/types/enums";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropiedadDetailPage({ params }: Props) {
  const { id } = await params;
  let property;
  try { property = await getPropertyById(id); } catch { notFound(); }

  const owner = property.owner as { id: string; full_name: string; phone?: string; email?: string } | null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={`${property.address}${property.unit ? ` - ${property.unit}` : ""}`}
        description="Ficha de propiedad"
        backHref="/propiedades"
        action={
          <div className="flex gap-2">
            <Link href={`/propiedades/${id}/editar`}><Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Editar</Button></Link>
            <PropiedadesDeleteButton id={id} address={property.address} redirectOnDelete="/propiedades" />
          </div>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Detalles</h2>
          <StatusBadge label={PROPERTY_STATUSES[property.status as PropertyStatus]} colorClass={PROPERTY_STATUS_COLORS[property.status as PropertyStatus]} />
        </div>
        <Separator className="my-4" />
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Direccion</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {property.address}{property.unit ? ` - ${property.unit}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ciudad</dt>
            <dd className="mt-1 text-sm text-gray-900">{property.city}, {property.province}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Tipo</dt>
            <dd className="mt-1 text-sm text-gray-900">{PROPERTY_TYPES[property.type as PropertyType]}</dd>
          </div>
        </dl>
      </div>

      {owner && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <User className="h-5 w-5 text-gray-400" /> Propietario
          </h2>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/duenos/${owner.id}`} className="font-medium text-gray-900 hover:text-teal-600">{owner.full_name}</Link>
              <div className="mt-1 flex gap-4 text-sm text-gray-500">
                {owner.phone && <span>{owner.phone}</span>}
                {owner.email && <span>{owner.email}</span>}
              </div>
            </div>
            <Link href={`/duenos/${owner.id}`}><Button variant="outline" size="sm">Ver ficha</Button></Link>
          </div>
        </div>
      )}

      {property.notes && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
          <Separator className="my-4" />
          <p className="whitespace-pre-wrap text-sm text-gray-600">{property.notes}</p>
        </div>
      )}
    </div>
  );
}
