import { notFound } from "next/navigation";
import { getTenantById, updateTenant } from "../../actions";
import { PageHeader } from "@/components/ui/page-header";
import { TenantForm } from "@/components/forms/tenant-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarInquilinoPage({ params }: Props) {
  const { id } = await params;
  let tenant;
  try { tenant = await getTenantById(id); } catch { notFound(); }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Editar inquilino" description={tenant.full_name} backHref={`/inquilinos/${id}`} />
      <TenantForm
        defaultValues={{
          full_name: tenant.full_name,
          dni: tenant.dni ?? "",
          phone: tenant.phone ?? "",
          email: tenant.email ?? "",
          notes: tenant.notes ?? "",
          guarantors: (tenant.guarantors || []) as { full_name: string; dni: string; phone: string; address: string }[],
        }}
        onSubmit={async (values) => { "use server"; await updateTenant(id, values); }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
