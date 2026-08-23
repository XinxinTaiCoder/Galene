import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Tells the login form whether a username has a real (non-internal) email
// bound, so it can either prompt for that email to send a reset link, or
// show the "bind an email first" guidance. Never returns the email itself,
// and returns hasRealEmail: false for unknown usernames too, so this can't
// be used to enumerate which usernames exist.
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

  const username = String(body?.username || "").trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ hasRealEmail: false });
  }

  const supabaseAdmin = getAdminClient();
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("has_real_email")
      .eq("username", username)
      .maybeSingle();
    if (error) {
      console.error("forgot-password-lookup error:", error.message, error.code, error.details, error.hint);
      return NextResponse.json({ hasRealEmail: false });
    }
    return NextResponse.json({ hasRealEmail: !!data?.has_real_email });
  } catch (err) {
    console.error("forgot-password-lookup exception:", err?.message, err);
    return NextResponse.json({ hasRealEmail: false });
  }
}
