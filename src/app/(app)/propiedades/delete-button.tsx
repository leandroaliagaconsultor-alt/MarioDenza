"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteProperty } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  id: string;
  address: string;
  redirectOnDelete?: string;
}

export function PropiedadesDeleteButton({ id, address, redirectOnDelete }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Eliminar propiedad"
        description={`¿Estas seguro que queres eliminar "${address}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={async () => {
          try {
            await deleteProperty(id);
            toast.success("Propiedad eliminada");
            if (redirectOnDelete) router.push(redirectOnDelete);
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al eliminar");
          }
        }}
      />
    </>
  );
}
