import { notFound } from "next/navigation";
import { getPropertyById, updateProperty, getAllOwners } from "../../actions";
import { PageHeader } from "@/components/ui/page-header";
import { PropertyForm } from "@/components/forms/property-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarPropiedadPage({ params }: Props) {
  const { id } = await params;
  let property;
  try { property = await getPropertyById(id); } catch { notFound(); }
  const owners = await getAllOwners();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Editar propiedad" description={property.address} backHref={`/propiedades/${id}`} />
      <PropertyForm
        owners={owners}
        defaultValues={{
          address: property.address,
          unit: property.unit ?? "",
          city: property.city ?? "Mercedes",
          province: property.province ?? "Buenos Aires",
          type: property.type as "residencial" | "comercial" | "temporario" | "otro",
          owner_id: property.owner_id,
          status: property.status as "ocupada" | "disponible" | "en_mantenimiento" | "retirada",
          notes: property.notes ?? "",
        }}
        onSubmit={async (values) => { "use server"; await updateProperty(id, values); }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
