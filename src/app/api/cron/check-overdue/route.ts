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

    // Mark overdue payments
    const { data: overdue } = await supabase
      .from("payments")
      .update({ status: "vencido" })
      .eq("status", "pendiente")
      .lt("due_date", today)
      .select("id");

    return NextResponse.json({ ok: true, marked: overdue?.length ?? 0 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
