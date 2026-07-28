import { NextResponse } from "next/server";

// Fire-and-forget admin ping on user login. Add RESEND_API_KEY to the
// server environment (Vercel env vars / .env.local) to enable — never
// exposed to the client. No-ops silently if unset.
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "galene_support@proton-mail.com";
const RESEND_FROM = process.env.RESEND_FROM || "Galene <onboarding@resend.dev>";

function esc(s) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

export async function POST(request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, reason: "not configured" });
  }
  try {
    const { email, userId } = await request.json();
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [ADMIN_EMAIL],
        subject: `🔑 用户登录：${email || userId || "未知"}`,
        html: `<p>Galene 用户登录</p>
          <p>邮箱：${esc(email)}</p>
          <p>用户 ID：${esc(userId)}</p>
          <p>时间：${esc(new Date().toISOString())}</p>`,
      }),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("notify-login error:", err?.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
