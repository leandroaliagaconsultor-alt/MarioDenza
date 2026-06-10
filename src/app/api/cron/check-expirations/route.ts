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

    // "Por vencer" y "vencido" se DERIVAN de end_date en toda la app; el status guardado
    // queda solo en activo/finalizado/rescindido. El cron ya no toca el status (eso causaba
    // que contratos desaparecieran de "Activo" y de Aumentos): solo cuenta, para log.
    const { count } = await supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .in("status", ["activo", "por_vencer"])
      .gte("end_date", today)
      .lte("end_date", in90days);

    return NextResponse.json({ ok: true, expiring: count ?? 0 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
