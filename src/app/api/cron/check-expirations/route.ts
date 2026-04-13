import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const in90days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Mark contracts expiring within 90 days as "por_vencer"
    const { data: expiring } = await supabase
      .from("contracts")
      .select("id")
      .eq("status", "activo")
      .lte("end_date", in90days);

    if (expiring && expiring.length > 0) {
      await supabase
        .from("contracts")
        .update({ status: "por_vencer" })
        .eq("status", "activo")
        .lte("end_date", in90days);
    }

    return NextResponse.json({ ok: true, marked: expiring?.length ?? 0 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
