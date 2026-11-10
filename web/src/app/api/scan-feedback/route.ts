import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/scan-feedback — 후보 화면에서 사용자가 직접 고른 가게 기록 (로그인 불필요)
// body: { log_id, store_id } → scan_logs.user_corrected = true, corrected_store_id = store_id

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const logId = Number(body.log_id);
  const storeId = Number(body.store_id);
  if (!Number.isSafeInteger(logId) || !Number.isSafeInteger(storeId)) {
    return Response.json(
      { error: "log_id and store_id are required" },
      { status: 400 },
    );
  }

  try {
    const { error } = await createAdminClient()
      .from("scan_logs")
      .update({ user_corrected: true, corrected_store_id: storeId })
      .eq("id", logId);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (caught) {
    console.error("[api/scan-feedback]", caught);
    return Response.json({ ok: false }, { status: 500 });
  }
}
