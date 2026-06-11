"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { revertPayment } from "../actions";

export function RevertPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm("¿Deshacer este pago? Vuelve a quedar pendiente y se borran los datos del cobro (fecha, método y monto pagado).")) return;
    setLoading(true);
    try {
      await revertPayment(paymentId);
      toast.success("Pago deshecho: quedó pendiente");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al deshacer el pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handle} disabled={loading} className="text-amber-700 hover:bg-amber-50">
      {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Undo2 className="mr-1 h-4 w-4" />}
      Deshacer pago
    </Button>
  );
}
