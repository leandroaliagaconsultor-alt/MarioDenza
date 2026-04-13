import { PageHeader } from "@/components/ui/page-header";
import { WizardShell } from "@/components/forms/contract-wizard/wizard-shell";
import { getAllProperties, getAllTenants } from "../actions";

export default async function NuevoContratoPage() {
  const [properties, tenants] = await Promise.all([
    getAllProperties(),
    getAllTenants(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nuevo contrato"
        description="Crea un contrato de alquiler paso a paso"
        backHref="/contratos"
      />
      <WizardShell
        properties={properties.map((p) => {
          const ownerData = Array.isArray(p.owner) ? p.owner[0] : p.owner;
          return {
            ...p,
            owner: ownerData as { full_name: string } | null,
          };
        })}
        tenants={tenants}
      />
    </div>
  );
}
