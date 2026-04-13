import { PageHeader } from "@/components/ui/page-header";
import { OwnerForm } from "@/components/forms/owner-form";
import { createOwner } from "../actions";

export default function NuevoDuenoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nuevo propietario"
        description="Registra un nuevo dueño"
        backHref="/duenos"
      />
      <OwnerForm onSubmit={createOwner} submitLabel="Crear propietario" />
    </div>
  );
}
