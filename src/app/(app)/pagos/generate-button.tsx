"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { generatePaymentsForMonth } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function GeneratePaymentsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    try {
      const now = new Date();
      const result = await generatePaymentsForMonth(now.getFullYear(), now.getMonth() + 1);
      if (result.created > 0) {
        toast.success(`${result.created} pagos generados para este mes`);
      } else {
        toast.info("Todos los pagos del mes ya estaban generados");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar pagos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={loading} variant="outline">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
      Generar pagos del mes
    </Button>
  );
}
