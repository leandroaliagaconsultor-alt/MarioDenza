import { notFound } from "next/navigation";
import { getContractById } from "../../actions";
import { PageHeader } from "@/components/ui/page-header";
import { ContractEditForm } from "./edit-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarContratoPage({ params }: Props) {
  const { id } = await params;
  let contract;
  try { contract = await getContractById(id); } catch { notFound(); }

  const propertyRaw = contract.property;
  const property = (Array.isArray(propertyRaw) ? propertyRaw[0] : propertyRaw) as { address: string; unit?: string } | null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Editar contrato"
        description={`${property?.address ?? ""}${property?.unit ? ` - ${property.unit}` : ""}`}
        backHref={`/contratos/${id}`}
      />
      <ContractEditForm
        contractId={id}
        defaultValues={{
          start_date: contract.start_date,
          end_date: contract.end_date,
          current_rent: contract.current_rent,
          payment_day: contract.payment_day,
          legal_framework: contract.legal_framework,
          agency_collects: contract.agency_collects,
          commission_percentage: contract.commission_percentage,
          late_fee_enabled: contract.late_fee_enabled,
          late_fee_type: contract.late_fee_type,
          late_fee_value: contract.late_fee_value,
          notes: contract.notes ?? "",
          extras: Array.isArray(contract.extras) ? contract.extras : [],
        }}
      />
    </div>
  );
}
