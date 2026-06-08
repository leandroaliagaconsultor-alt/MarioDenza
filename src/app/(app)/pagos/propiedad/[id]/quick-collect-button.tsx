"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { quickCollectPayment } from "../../actions";
import { toast } from "sonner";

export function QuickCollectButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handle() {
    setSaving(true);
    try {
      await quickCollectPayment(paymentId);
      toast.success("Pago registrado (hoy · efectivo · monto completo)");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al registrar el pago");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handle}
      disabled={saving}
      className="border-teal-300 text-teal-700 hover:bg-teal-50"
    >
      {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
      Cobrar
    </Button>
  );
}
