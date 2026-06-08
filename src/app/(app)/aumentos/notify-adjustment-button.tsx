"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp/link-builder";
import { adjustmentMessage, ownerAdjustmentMessage } from "@/lib/whatsapp/templates";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { toast } from "sonner";
import type { CurrencyType } from "@/lib/types/enums";

interface Props {
  tenantName: string;
  tenantPhone: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  propertyAddress: string;
  currentRent: number;
  currency: CurrencyType;
  nextDate: string;
  defaultNewRent?: number;
  label?: string;
}

export function NotifyAdjustmentButton(props: Props) {
  const [open, setOpen] = useState(false);
  const [newRent, setNewRent] = useState(props.defaultNewRent ? String(props.defaultNewRent) : "");
  const [effDate, setEffDate] = useState(props.nextDate);

  function send(target: "tenant" | "owner") {
    const amount = Number(newRent);
    if (!amount || amount <= 0) { toast.error("Ingresá el nuevo monto del alquiler"); return; }
    const prev = formatCurrency(props.currentRent, props.currency);
    const next = formatCurrency(amount, props.currency);
    const eff = formatDate(effDate);

    if (target === "tenant") {
      if (!props.tenantPhone) return;
      const msg = adjustmentMessage({ tenantName: props.tenantName, propertyAddress: props.propertyAddress, previousRent: prev, newRent: next, effectiveDate: eff });
      window.open(buildWhatsAppLink(props.tenantPhone, msg), "_blank");
    } else {
      if (!props.ownerPhone || !props.ownerName) return;
      const msg = ownerAdjustmentMessage({ ownerName: props.ownerName, tenantName: props.tenantName, propertyAddress: props.propertyAddress, previousRent: prev, newRent: next, effectiveDate: eff });
      window.open(buildWhatsAppLink(props.ownerPhone, msg), "_blank");
    }
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-green-300 text-green-700 hover:bg-green-50"
      >
        <MessageCircle className="mr-1.5 h-4 w-4" /> {props.label ?? "Avisar aumento"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avisar aumento</DialogTitle>
            <DialogDescription>Cargá el nuevo alquiler y desde cuándo rige; el mensaje sale listo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Alquiler actual: <span className="font-medium text-gray-900">{formatCurrency(props.currentRent, props.currency)}</span>
            </div>
            <div>
              <Label>Nuevo alquiler *</Label>
              <Input type="number" value={newRent} onChange={(e) => setNewRent(e.target.value)} placeholder="0" className="mt-1" autoFocus />
            </div>
            <div>
              <Label>Vigente desde *</Label>
              <Input type="date" value={effDate} onChange={(e) => setEffDate(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="-mx-4 -mb-4 flex flex-col gap-2 rounded-b-xl border-t bg-gray-50/50 p-4 sm:flex-row sm:justify-end">
            {props.tenantPhone && (
              <Button type="button" size="sm" onClick={() => send("tenant")} className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="mr-1.5 h-4 w-4" /> Enviar al inquilino
              </Button>
            )}
            {props.ownerPhone && (
              <Button type="button" size="sm" variant="outline" onClick={() => send("owner")} className="border-green-300 text-green-700 hover:bg-green-50">
                <MessageCircle className="mr-1.5 h-4 w-4" /> Enviar al propietario
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
