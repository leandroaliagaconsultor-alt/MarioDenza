"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp/link-builder";
import { adjustmentMessage, contractExpirationMessage, ownerExpirationMessage, ownerAdjustmentMessage } from "@/lib/whatsapp/templates";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { toast } from "sonner";
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
  adjustmentNextDate?: string;
}

export function WhatsAppButton({
  tenantPhone, tenantName, ownerPhone, ownerName,
  propertyAddress, currentRent, currency, endDate, contractStatus, adjustmentNextDate,
}: Props) {
  const isExpiring = contractStatus === "por_vencer";

  const [adjOpen, setAdjOpen] = useState(false);
  const [newRent, setNewRent] = useState("");
  const [effDate, setEffDate] = useState(adjustmentNextDate || new Date().toISOString().split("T")[0]);

  function sendAdjustment(target: "tenant" | "owner") {
    const amount = Number(newRent);
    if (!amount || amount <= 0) { toast.error("Ingresá el nuevo monto del alquiler"); return; }
    const prev = formatCurrency(currentRent, currency);
    const next = formatCurrency(amount, currency);
    const eff = formatDate(effDate);

    if (target === "tenant") {
      const msg = adjustmentMessage({ tenantName, propertyAddress, previousRent: prev, newRent: next, effectiveDate: eff });
      window.open(buildWhatsAppLink(tenantPhone, msg), "_blank");
    } else {
      if (!ownerPhone || !ownerName) return;
      const msg = ownerAdjustmentMessage({ ownerName, tenantName, propertyAddress, previousRent: prev, newRent: next, effectiveDate: eff });
      window.open(buildWhatsAppLink(ownerPhone, msg), "_blank");
    }
    setAdjOpen(false);
  }

  function handleTenantExpirationMsg() {
    const msg = contractExpirationMessage({ tenantName, propertyAddress, endDate: formatDate(endDate) });
    window.open(buildWhatsAppLink(tenantPhone, msg), "_blank");
  }

  function handleOwnerExpirationMsg() {
    if (!ownerPhone || !ownerName) return;
    const msg = ownerExpirationMessage({ ownerName, tenantName, propertyAddress, endDate: formatDate(endDate) });
    window.open(buildWhatsAppLink(ownerPhone, msg), "_blank");
  }

  return (
    <>
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
            <Button variant="outline" size="sm" onClick={() => setAdjOpen(true)} className="text-green-700 border-green-300 hover:bg-green-50">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Avisar aumento
            </Button>
            <Button variant="outline" size="sm" onClick={handleTenantExpirationMsg} className="text-green-700 border-green-300 hover:bg-green-50">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Avisar vencimiento
            </Button>
          </>
        )}
      </div>

      <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avisar aumento</DialogTitle>
            <DialogDescription>Completá el nuevo alquiler y desde cuándo rige; el mensaje sale listo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Alquiler actual: <span className="font-medium text-gray-900">{formatCurrency(currentRent, currency)}</span>
            </div>
            <div>
              <Label>Nuevo alquiler *</Label>
              <Input
                type="number"
                value={newRent}
                onChange={(e) => setNewRent(e.target.value)}
                placeholder="0"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label>Vigente desde *</Label>
              <Input type="date" value={effDate} onChange={(e) => setEffDate(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="-mx-4 -mb-4 flex flex-col gap-2 rounded-b-xl border-t bg-gray-50/50 p-4 sm:flex-row sm:justify-end">
            <Button type="button" size="sm" onClick={() => sendAdjustment("tenant")} className="bg-green-600 hover:bg-green-700">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Enviar al inquilino
            </Button>
            {ownerPhone && (
              <Button type="button" size="sm" variant="outline" onClick={() => sendAdjustment("owner")} className="border-green-300 text-green-700 hover:bg-green-50">
                <MessageCircle className="mr-1.5 h-4 w-4" /> Enviar al propietario
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
