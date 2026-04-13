"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp/link-builder";
import { overduePaymentMessage } from "@/lib/whatsapp/templates";

interface Props {
  type: "overdue";
  phone: string;
  tenantName: string;
  propertyAddress: string;
  amount: string;
  period: string;
  dueDate: string;
}

export function DashboardWhatsApp({ phone, tenantName, propertyAddress, amount, period, dueDate }: Props) {
  function handleClick() {
    const msg = overduePaymentMessage({
      tenantName,
      propertyAddress,
      period,
      amount: `$${amount}`,
      currency: "ARS",
      dueDate,
    });
    window.open(buildWhatsAppLink(phone, msg), "_blank");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="h-7 px-2 text-green-700 border-green-300 hover:bg-green-50">
      <MessageCircle className="h-3.5 w-3.5" />
    </Button>
  );
}
