import { PageHeader } from "@/components/ui/page-header";
import { TenantForm } from "@/components/forms/tenant-form";
import { createTenant } from "../actions";

export default function NuevoInquilinoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Nuevo inquilino" description="Registra un nuevo inquilino" backHref="/inquilinos" />
      <TenantForm onSubmit={createTenant} submitLabel="Crear inquilino" />
    </div>
  );
}
