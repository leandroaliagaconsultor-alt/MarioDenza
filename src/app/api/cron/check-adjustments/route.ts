import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: pending } = await supabase
      .from("contract_adjustments")
      .select("id, contract_id, next_adjustment_date")
      .lte("next_adjustment_date", in30days);

    // Log notifications for each pending adjustment
    for (const adj of pending || []) {
      await supabase.from("notifications_log").upsert({
        type: "aumento",
        contract_id: adj.contract_id,
        channel: "internal",
        message_preview: `Aumento programado para ${adj.next_adjustment_date}`,
        sent_at: new Date().toISOString(),
      }, { onConflict: "type,contract_id" }).select();
    }

    return NextResponse.json({ ok: true, pending: pending?.length ?? 0 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
