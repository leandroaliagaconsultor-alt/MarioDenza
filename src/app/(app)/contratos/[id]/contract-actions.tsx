"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { finalizeContract } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface Props {
  contractId: string;
}

export function ContractActions({ contractId }: Props) {
  const [showFinalize, setShowFinalize] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowFinalize(true)}>
        <CheckCircle className="mr-1 h-4 w-4" /> Finalizar
      </Button>

      <ConfirmDialog
        open={showFinalize}
        onOpenChange={setShowFinalize}
        title="Finalizar contrato"
        description="Al finalizar, la propiedad quedara como disponible. ¿Estas seguro?"
        confirmText="Finalizar contrato"
        variant="default"
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
    </>
  );
}
