import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];
    const in90days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Marcar como "por_vencer" los que vencen en los próximos 90 días (hoy → hoy+90).
    // Importante: con piso en hoy, los ya vencidos NO se re-marcan (se ven como "Vencidos" en el dashboard).
    const { data: expiring } = await supabase
      .from("contracts")
      .select("id")
      .eq("status", "activo")
      .gte("end_date", today)
      .lte("end_date", in90days);

    if (expiring && expiring.length > 0) {
      await supabase
        .from("contracts")
        .update({ status: "por_vencer" })
        .eq("status", "activo")
        .gte("end_date", today)
        .lte("end_date", in90days);
    }

    return NextResponse.json({ ok: true, marked: expiring?.length ?? 0 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
