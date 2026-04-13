"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp/link-builder";
import { adjustmentMessage, contractExpirationMessage } from "@/lib/whatsapp/templates";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { CurrencyType } from "@/lib/types/enums";

interface Props {
  phone: string;
  tenantName: string;
  propertyAddress: string;
  currentRent: number;
  currency: CurrencyType;
  endDate: string;
}

export function WhatsAppButton({ phone, tenantName, propertyAddress, currentRent, currency, endDate }: Props) {
  function handleAdjustmentMsg() {
    const msg = adjustmentMessage({
      tenantName,
      propertyAddress,
      previousRent: formatCurrency(currentRent, currency),
      newRent: "[MONTO NUEVO]",
      effectiveDate: "[FECHA]",
      currency,
    });
    window.open(buildWhatsAppLink(phone, msg), "_blank");
  }

  function handleExpirationMsg() {
    const msg = contractExpirationMessage({
      tenantName,
      propertyAddress,
      endDate: formatDate(endDate),
    });
    window.open(buildWhatsAppLink(phone, msg), "_blank");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleAdjustmentMsg} className="text-green-700 border-green-300 hover:bg-green-50">
        <MessageCircle className="mr-1.5 h-4 w-4" /> Avisar aumento por WhatsApp
      </Button>
      <Button variant="outline" size="sm" onClick={handleExpirationMsg} className="text-green-700 border-green-300 hover:bg-green-50">
        <MessageCircle className="mr-1.5 h-4 w-4" /> Avisar vencimiento
      </Button>
    </div>
  );
}
