"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp/link-builder";
import { adjustmentMessage, contractExpirationMessage, ownerExpirationMessage } from "@/lib/whatsapp/templates";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { CurrencyType } from "@/lib/types/enums";

interface Props {
  tenantPhone: string;
  tenantName: string;
  ownerPhone?: string;
  ownerName?: string;
  propertyAddress: string;
  currentRent: number;
  currency: CurrencyType;
  endDate: string;
  contractStatus: string;
}

export function WhatsAppButton({
  tenantPhone, tenantName, ownerPhone, ownerName,
  propertyAddress, currentRent, currency, endDate, contractStatus,
}: Props) {
  const isExpiring = contractStatus === "por_vencer";

  function handleAdjustmentMsg() {
    const msg = adjustmentMessage({
      tenantName, propertyAddress,
      previousRent: formatCurrency(currentRent, currency),
      newRent: "[MONTO NUEVO]",
      effectiveDate: "[FECHA]",
      currency,
    });
    window.open(buildWhatsAppLink(tenantPhone, msg), "_blank");
  }

  function handleTenantExpirationMsg() {
    const msg = contractExpirationMessage({
      tenantName, propertyAddress, endDate: formatDate(endDate),
    });
    window.open(buildWhatsAppLink(tenantPhone, msg), "_blank");
  }

  function handleOwnerExpirationMsg() {
    if (!ownerPhone || !ownerName) return;
    const msg = ownerExpirationMessage({
      ownerName, tenantName, propertyAddress, endDate: formatDate(endDate),
    });
    window.open(buildWhatsAppLink(ownerPhone, msg), "_blank");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isExpiring ? (
        <>
          <Button variant="outline" size="sm" onClick={handleTenantExpirationMsg} className="text-green-700 border-green-300 hover:bg-green-50">
            <MessageCircle className="mr-1.5 h-4 w-4" /> Avisar inquilino (vencimiento)
          </Button>
          {ownerPhone && (
            <Button variant="outline" size="sm" onClick={handleOwnerExpirationMsg} className="text-green-700 border-green-300 hover:bg-green-50">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Avisar propietario (vencimiento)
            </Button>
          )}
        </>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={handleAdjustmentMsg} className="text-green-700 border-green-300 hover:bg-green-50">
            <MessageCircle className="mr-1.5 h-4 w-4" /> Avisar aumento por WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={handleTenantExpirationMsg} className="text-green-700 border-green-300 hover:bg-green-50">
            <MessageCircle className="mr-1.5 h-4 w-4" /> Avisar vencimiento
          </Button>
        </>
      )}
    </div>
  );
}
