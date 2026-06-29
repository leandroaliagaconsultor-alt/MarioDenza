"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarPlus } from "lucide-react";
import { generateNextMonthForContract } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Genera el pago del mes que viene para este contrato y lleva a cobrarlo.
 * Pensado para cuando el inquilino paga 2 meses juntos: cobrás este mes y desde
 * acá generás el del siguiente para registrarlo también.
 */
export function AdvancePaymentButton({ contractId }: { contractId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handle() {
    setLoading(true);
    try {
      const r = await generateNextMonthForContract(contractId);
      if (r.created) {
        toast.success(`Pago de ${r.period} generado. Registrá el cobro.`);
      } else {
        toast.info(`El pago de ${r.period} ya existía. Te llevo a cobrarlo.`);
      }
      router.push(`/pagos/${r.paymentId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar el pago del mes que viene");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handle} disabled={loading} variant="outline" size="sm">
      {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-1 h-4 w-4" />}
      Generar pago del mes que viene
    </Button>
  );
}
