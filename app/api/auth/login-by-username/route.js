import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Username-based login has to happen server-side: the client must never see
// the internal @galene.internal address tied to a username, so we resolve
// username -> auth user -> email here with the service role key, verify the
// password via signInWithPassword, and hand the resulting session back.
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Same-origin check to keep this endpoint from being hammered from other
// sites — the app (web and the Capacitor iOS build, which loads the live
// production URL in a WKWebView) always sends Origin or Referer matching its
// own host on a same-origin fetch.
function isTrustedOrigin(request) {
  const host = request.headers.get("host");
  if (!host) return false;
  for (const header of ["origin", "referer"]) {
    const value = request.headers.get(header);
    if (!value) continue;
    try {
      if (new URL(value).host === host) return true;
    } catch {
      // ignore malformed header, fall through
    }
  }
  return false;
}

export async function POST(request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const username = String(body?.username || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!username || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const supabaseAdmin = getAdminClient();

  try {
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (profileError) {
      console.error("login-by-username profile lookup error:", profileError.message, profileError.code, profileError.details, profileError.hint);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    if (!profileRow) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileRow.id);
    if (userError || !userData?.user?.email) {
      console.error("login-by-username getUserById error:", userError?.message, userError);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });
    if (signInError || !signInData?.session) {
      if (signInError) console.error("login-by-username signIn error:", signInError.message, signInError.status);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({ session: signInData.session });
  } catch (err) {
    console.error("login-by-username exception:", err?.message, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
