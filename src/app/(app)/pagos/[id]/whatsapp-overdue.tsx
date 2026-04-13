"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp/link-builder";
import { overduePaymentMessage } from "@/lib/whatsapp/templates";

interface Props {
  phone: string;
  tenantName: string;
  propertyAddress: string;
  period: string;
  amount: string;
  currency: string;
  dueDate: string;
}

export function WhatsAppOverdueButton({ phone, tenantName, propertyAddress, period, amount, currency, dueDate }: Props) {
  function handleClick() {
    const msg = overduePaymentMessage({
      tenantName,
      propertyAddress,
      period,
      amount,
      currency,
      dueDate,
    });
    window.open(buildWhatsAppLink(phone, msg), "_blank");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="text-green-700 border-green-300 hover:bg-green-50">
      <MessageCircle className="mr-1.5 h-4 w-4" /> Avisar por WhatsApp
    </Button>
  );
}
