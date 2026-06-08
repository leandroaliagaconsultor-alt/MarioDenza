"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileDown, Check, Loader2 } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp/link-builder";
import { ownerPayoutMessage } from "@/lib/whatsapp/templates";
import { formatCurrency } from "@/lib/utils/format";
import { markOwnerPaid } from "../actions";
import { toast } from "sonner";
import type { CurrencyType } from "@/lib/types/enums";

interface Props {
  ownerId: string;
  ownerName: string;
  ownerPhone: string | null;
  period: string;
  currency: CurrencyType;
  total: number;
  ready: boolean;
  liquidatedAt: string | null;
  rows: { address: string; payout: number }[];
}

export function PayoutActions(props: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  function handleWhatsApp() {
    if (!props.ownerPhone) return;
    const msg = ownerPayoutMessage({
      ownerName: props.ownerName,
      period: props.period,
      lines: props.rows.map((r) => ({
        address: r.address,
        amount: formatCurrency(r.payout, props.currency),
      })),
      total: formatCurrency(props.total, props.currency),
    });
    window.open(buildWhatsAppLink(props.ownerPhone, msg), "_blank");
  }

  async function handleMarkPaid() {
    setSaving(true);
    try {
      await markOwnerPaid(props.ownerId, props.period, props.total);
      toast.success("Liquidación registrada");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al registrar la liquidación");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {props.ownerPhone && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleWhatsApp}
          className="border-green-300 text-green-700 hover:bg-green-50"
        >
          <MessageCircle className="mr-1.5 h-4 w-4" /> Enviar desglose por WhatsApp
        </Button>
      )}
      <a href={`/api/payout/${props.ownerId}?period=${props.period}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm">
          <FileDown className="mr-1.5 h-4 w-4" /> Descargar PDF
        </Button>
      </a>
      {!props.liquidatedAt && (
        <Button
          size="sm"
          onClick={handleMarkPaid}
          disabled={!props.ready || saving}
          className="bg-teal-600 hover:bg-teal-700"
          title={!props.ready ? "Faltan cobrar propiedades de este dueño" : undefined}
        >
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
          Marcar como pagado al dueño
        </Button>
      )}
    </div>
  );
}
