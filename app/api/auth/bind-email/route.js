import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Binding a real email onto a username-only account has to go through the
// admin API: this project's Supabase Auth settings validate the domain of
// the *current* email (via an MX-record-style check) on the regular
// supabase.auth.updateUser() email-change path, and our auto-generated
// internal placeholder domain has no real MX record — every such call would
// 400 with "email_address_invalid" even though the new address is fine. The
// admin updateUserById endpoint skips that check entirely.
const isValidEmailFormat = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const supabaseAdmin = getAdminClient();
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = String(body?.email || "").trim();
  if (!isValidEmailFormat(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email });
    if (updateError) {
      console.error("bind-email admin updateUserById error:", updateError.message, updateError.status, updateError);
      const status = updateError.status === 422 || updateError.code === "email_exists" ? 409 : 500;
      return NextResponse.json({ error: updateError.message || "Update failed" }, { status });
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles").update({ has_real_email: true }).eq("id", user.id);
    if (profileError) {
      console.error("bind-email profile update error:", profileError.message, profileError.code, profileError.details, profileError.hint);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("bind-email exception:", err?.message, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
