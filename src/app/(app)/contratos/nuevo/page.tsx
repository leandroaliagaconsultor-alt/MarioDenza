import { PageHeader } from "@/components/ui/page-header";
import { WizardShell } from "@/components/forms/contract-wizard/wizard-shell";
import { getAllProperties, getAllTenants } from "../actions";
import type { ContractFormValues } from "@/lib/validators/contract";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function NuevoContratoPage({ searchParams }: Props) {
  const params = await searchParams;
  const [properties, tenants] = await Promise.all([
    getAllProperties(),
    getAllTenants(),
  ]);

  const isRenewal = !!params.renew_from;

  // Build prefill from renewal params
  const prefill: Partial<ContractFormValues> | undefined = isRenewal ? {
    property_id: params.property_id ?? "",
    tenant_id: params.tenant_id ?? "",
    base_rent: params.base_rent ? Number(params.base_rent) : 0,
    currency: (params.currency as "ARS" | "USD") ?? "ARS",
    adjustment_index_type: (params.index_type as ContractFormValues["adjustment_index_type"]) ?? null,
    adjustment_frequency_months: params.frequency ? Number(params.frequency) : null,
  } : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={isRenewal ? "Renovar contrato" : "Nuevo contrato"}
        description={isRenewal ? "Crea un nuevo contrato basado en el anterior" : "Crea un contrato de alquiler paso a paso"}
        backHref="/contratos"
      />
      <WizardShell
        properties={properties.map((p) => {
          const ownerData = Array.isArray(p.owner) ? p.owner[0] : p.owner;
          return { ...p, owner: ownerData as { full_name: string } | null };
        })}
        tenants={tenants}
        prefill={prefill}
        renewFrom={params.renew_from}
      />
    </div>
  );
}
