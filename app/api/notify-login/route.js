import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Admin ping on user login. Requires the caller's own Supabase access token
// so this can't be spammed anonymously or spoofed with a fake email — the
// email/userId sent to the admin come from the verified token, never from
// the request body. Add RESEND_API_KEY to the server environment to enable
// — never exposed to the client. No-ops silently if unset.
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "galene_support@proton-mail.com";
const RESEND_FROM = process.env.RESEND_FROM || "Galene <onboarding@resend.dev>";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function esc(s) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

export async function POST(request) {
  if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, reason: "not configured" });
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

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [ADMIN_EMAIL],
        subject: `🔑 用户登录：${user.email || user.id}`,
        html: `<p>Galene 用户登录</p>
          <p>邮箱：${esc(user.email)}</p>
          <p>用户 ID：${esc(user.id)}</p>
          <p>时间：${esc(new Date().toISOString())}</p>`,
      }),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("notify-login error:", err?.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
