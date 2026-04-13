"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { finalizeContract } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, RefreshCw } from "lucide-react";

interface Props {
  contractId: string;
  propertyId: string;
  tenantId: string;
  currentRent: number;
  currency: string;
  endDate: string;
  adjustmentIndexType?: string;
  adjustmentFrequency?: number;
}

export function ContractActions({ contractId, propertyId, tenantId, currentRent, currency, endDate, adjustmentIndexType, adjustmentFrequency }: Props) {
  const [showFinalize, setShowFinalize] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const router = useRouter();

  const renewParams = new URLSearchParams({
    renew_from: contractId,
    property_id: propertyId,
    tenant_id: tenantId,
    base_rent: String(currentRent),
    currency: currency,
    ...(adjustmentIndexType ? { index_type: adjustmentIndexType } : {}),
    ...(adjustmentFrequency ? { frequency: String(adjustmentFrequency) } : {}),
  });

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setShowRenew(true)}>
        <RefreshCw className="mr-1 h-4 w-4" /> Renovar
      </Button>
      <Button variant="outline" size="sm" onClick={() => setShowFinalize(true)}>
        <CheckCircle className="mr-1 h-4 w-4" /> Finalizar
      </Button>

      <ConfirmDialog
        open={showRenew}
        onOpenChange={setShowRenew}
        title="Renovar contrato"
        description="Se va a crear un nuevo contrato vinculado a este. El contrato actual se finalizara automaticamente al confirmar la renovacion. ¿Deseas continuar?"
        confirmText="Renovar contrato"
        variant="default"
        onConfirm={async () => {
          router.push(`/contratos/nuevo?${renewParams.toString()}`);
        }}
      />

      <ConfirmDialog
        open={showFinalize}
        onOpenChange={setShowFinalize}
        title="Finalizar contrato"
        description="Al finalizar, la propiedad quedara como disponible y no se generaran mas pagos. ¿Estas seguro que deseas finalizar este contrato?"
        confirmText="Finalizar contrato"
        variant="destructive"
        onConfirm={async () => {
          try {
            await finalizeContract(contractId);
            toast.success("Contrato finalizado");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        }}
      />
    </div>
  );
}
