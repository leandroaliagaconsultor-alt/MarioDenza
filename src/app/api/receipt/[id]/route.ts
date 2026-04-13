import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptDocument } from "@/lib/pdf/receipt-template";
import { PAYMENT_METHODS } from "@/lib/types/enums";
import type { PaymentMethod } from "@/lib/types/enums";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: payment, error } = await supabase
    .from("payments")
    .select(`
      *,
      contract:contracts(
        currency,
        property:properties(address, unit, owner:owners(full_name)),
        tenant:tenants(full_name, dni)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  const contract = payment.contract as {
    currency: string;
    property: { address: string; unit?: string; owner: { full_name: string } | { full_name: string }[] } | null;
    tenant: { full_name: string; dni?: string } | null;
  } | null;

  const ownerData = contract?.property?.owner;
  const owner = Array.isArray(ownerData) ? ownerData[0] : ownerData;

  const data = {
    receiptNumber: id.substring(0, 8).toUpperCase(),
    date: payment.paid_date || new Date().toISOString().split("T")[0],
    property: {
      address: contract?.property?.address ?? "",
      unit: contract?.property?.unit,
    },
    tenant: {
      full_name: contract?.tenant?.full_name ?? "",
      dni: contract?.tenant?.dni,
    },
    owner: {
      full_name: owner?.full_name ?? "",
    },
    period: payment.period.substring(0, 7),
    amountDue: String(payment.amount_due),
    amountPaid: String(payment.amount_paid),
    discount: String(payment.discount_amount),
    lateFee: String(payment.late_fee_amount),
    commission: String(payment.commission_amount),
    ownerPayout: String(payment.owner_payout),
    paymentMethod: payment.payment_method
      ? PAYMENT_METHODS[payment.payment_method as PaymentMethod]
      : "—",
    currency: contract?.currency ?? "ARS",
  };

  const buffer = await renderToBuffer(
    React.createElement(ReceiptDocument, { data }) as any
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${data.period}-${data.receiptNumber}.pdf"`,
    },
  });
}
