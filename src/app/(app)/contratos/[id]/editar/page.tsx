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

  const adjRaw = contract.contract_adjustments;
  const adj = (Array.isArray(adjRaw) ? adjRaw[0] : adjRaw) as {
    index_type?: string;
    frequency_months?: number;
    next_adjustment_date?: string;
    fixed_percentage?: number | null;
    mix_weight_icl?: number | null;
    escalones?: { date: string; amount: number }[] | null;
  } | null;

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
          adjustment_index_type: adj?.index_type ?? "",
          adjustment_frequency_months: adj?.frequency_months ?? 3,
          adjustment_next_date: adj?.next_adjustment_date ?? "",
          adjustment_fixed_percentage: adj?.fixed_percentage ?? null,
          adjustment_mix_weight_icl: adj?.mix_weight_icl ?? 50,
          adjustment_escalones: Array.isArray(adj?.escalones) ? adj.escalones : [],
        }}
      />
    </div>
  );
}
