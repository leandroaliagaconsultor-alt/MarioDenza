import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { PayoutDocument } from "@/lib/pdf/payout-template";
import { getOwnerLiquidationDetail } from "@/app/(app)/liquidaciones/actions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { loadLogoDataUri } from "@/lib/pdf/logo";
import type { CurrencyType } from "@/lib/types/enums";
import React from "react";

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  const { ownerId } = await params;
  const period = request.nextUrl.searchParams.get("period") || currentPeriod();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const liq = await getOwnerLiquidationDetail(ownerId, period);
  if (!liq) {
    return NextResponse.json({ error: "Sin datos para este dueño/período" }, { status: 404 });
  }
  const currency = liq.currency as CurrencyType;
  const logo = await loadLogoDataUri(request.nextUrl.origin);

  const data = {
    logo,
    ownerName: liq.ownerName,
    period,
    date: formatDate(new Date().toISOString().split("T")[0]),
    rows: liq.rows.map((r) => ({
      address: r.propertyAddress,
      tenant: r.tenantName ?? "—",
      collected: formatCurrency(r.amountPaid, currency),
      commission: formatCurrency(r.commission, currency),
      payout: formatCurrency(r.ownerPayout, currency),
    })),
    totalCollected: formatCurrency(liq.totalCollected, currency),
    totalCommission: formatCurrency(liq.totalCommission, currency),
    totalPayout: formatCurrency(liq.totalPayout, currency),
  };

  const buffer = await renderToBuffer(
    React.createElement(PayoutDocument, { data }) as any
  );

  const safeName = liq.ownerName.replace(/[^\w]+/g, "-");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="liquidacion-${safeName}-${period}.pdf"`,
    },
  });
}
