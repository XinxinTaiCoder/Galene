import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Pre-signup username-availability check. Runs server-side with the service
// role key so we don't have to open an anon RLS policy on profiles just for
// this lookup (mirrors the server-side pattern used by the other admin/auth
// routes in this app).
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const username = String(body?.username || "").trim();
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const usernameLower = username.toLowerCase();
  const supabaseAdmin = getAdminClient();

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", usernameLower)
      .limit(1);
    if (error) {
      console.error("check-username query error:", error.message, error.code, error.details, error.hint);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    return NextResponse.json({ available: !data || data.length === 0 });
  } catch (err) {
    console.error("check-username exception:", err?.message, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
