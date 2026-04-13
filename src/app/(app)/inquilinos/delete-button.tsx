"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteTenant } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  id: string;
  name: string;
  redirectOnDelete?: string;
}

export function InquilinosDeleteButton({ id, name, redirectOnDelete }: Props) {
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
        title="Eliminar inquilino"
        description={`¿Estas seguro que queres eliminar a "${name}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={async () => {
          try {
            await deleteTenant(id);
            toast.success("Inquilino eliminado");
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
