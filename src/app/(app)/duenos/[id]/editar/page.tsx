import { notFound } from "next/navigation";
import { getOwnerById, updateOwner } from "../../actions";
import { PageHeader } from "@/components/ui/page-header";
import { OwnerForm } from "@/components/forms/owner-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarDuenoPage({ params }: Props) {
  const { id } = await params;
  let owner;
  try {
    owner = await getOwnerById(id);
  } catch {
    notFound();
  }

  const bankInfo = (owner.bank_info || {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Editar propietario"
        description={owner.full_name}
        backHref={`/duenos/${id}`}
      />
      <OwnerForm
        defaultValues={{
          full_name: owner.full_name,
          dni_cuit: owner.dni_cuit ?? "",
          phone: owner.phone ?? "",
          email: owner.email ?? "",
          address: owner.address ?? "",
          bank_info: {
            cbu: bankInfo.cbu ?? "",
            banco: bankInfo.banco ?? "",
            alias: bankInfo.alias ?? "",
          },
          notes: owner.notes ?? "",
        }}
        onSubmit={async (values) => {
          "use server";
          await updateOwner(id, values);
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
