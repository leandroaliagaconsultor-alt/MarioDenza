import { PageHeader } from "@/components/ui/page-header";
import { PropertyForm } from "@/components/forms/property-form";
import { createProperty, getAllOwners } from "../actions";

export default async function NuevaPropiedadPage() {
  const owners = await getAllOwners();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Nueva propiedad" description="Registra una nueva propiedad" backHref="/propiedades" />
      <PropertyForm owners={owners} onSubmit={createProperty} submitLabel="Crear propiedad" />
    </div>
  );
}
