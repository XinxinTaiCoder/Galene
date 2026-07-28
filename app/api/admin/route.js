import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// All admin reads/writes go through here with the service role key, which
// bypasses RLS. RLS policies on profiles/posts/messages/reports only ever
// grant access to a row's own owner (auth.uid() = ...) — there is no admin
// bypass policy, so doing this from the browser with the anon key silently
// no-ops (0 rows affected, no error). Gate is a server-only password, never
// shipped to the client (unlike the old NEXT_PUBLIC_ADMIN_PASSWORD).
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function checkPassword(password) {
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

async function enrich(supabaseAdmin, rows) {
  const userTargetIds = rows.filter((r) => r.target_type === "user").map((r) => r.target_id);
  const postIds = [...new Set(rows.filter((r) => r.target_type === "post").map((r) => r.target_id))];
  const msgIds = [...new Set(rows.filter((r) => r.target_type === "message").map((r) => r.target_id))];
  const reporterIds = rows.map((r) => r.reporter_id).filter(Boolean);

  const contents = {};
  const authorIds = {};
  const profileIds = new Set([...userTargetIds, ...reporterIds]);

  if (postIds.length > 0) {
    const { data: postData } = await supabaseAdmin.from("posts").select("id, body, author_id").in("id", postIds);
    (postData || []).forEach((p) => {
      contents[p.id] = p.body;
      authorIds[p.id] = p.author_id;
      if (p.author_id) profileIds.add(p.author_id);
    });
  }
  if (msgIds.length > 0) {
    const { data: msgData } = await supabaseAdmin.from("messages").select("id, body, author_id").in("id", msgIds);
    (msgData || []).forEach((m) => {
      contents[m.id] = m.body;
      authorIds[m.id] = m.author_id;
      if (m.author_id) profileIds.add(m.author_id);
    });
  }

  const profiles = {};
  const idList = [...profileIds].filter(Boolean);
  if (idList.length > 0) {
    const { data: pData } = await supabaseAdmin.from("profiles").select("id, nickname, avatar, banned").in("id", idList);
    (pData || []).forEach((p) => { profiles[p.id] = p; });
  }

  return { profiles, contents, authorIds };
}

export async function POST(request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { password, action } = body || {};
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getAdminClient();

  try {
    switch (action) {
      case "list": {
        const { data: open, error: e1 } = await supabaseAdmin
          .from("reports").select("*").eq("status", "open").order("created_at", { ascending: false });
        if (e1) throw e1;
        const { data: reviewed, error: e2 } = await supabaseAdmin
          .from("reports").select("*").eq("status", "reviewed").order("created_at", { ascending: false }).limit(50);
        if (e2) throw e2;
        const openRows = open || [];
        const reviewedRows = reviewed || [];
        const { profiles, contents, authorIds } = await enrich(supabaseAdmin, [...openRows, ...reviewedRows]);
        return NextResponse.json({ open: openRows, reviewed: reviewedRows, profiles, contents, authorIds });
      }

      case "ban": {
        const { targetId, reportId } = body;
        const { error } = await supabaseAdmin.from("profiles").update({ banned: true }).eq("id", targetId);
        if (error) throw error;
        if (reportId) await supabaseAdmin.from("reports").update({ status: "reviewed" }).eq("id", reportId);
        return NextResponse.json({ ok: true });
      }

      case "unban": {
        const { targetId } = body;
        const { error } = await supabaseAdmin.from("profiles").update({ banned: false }).eq("id", targetId);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "hidePost": {
        const { targetId, reportId, alsoBanAuthor, authorId } = body;
        const { error } = await supabaseAdmin.from("posts").update({ hidden: true }).eq("id", targetId);
        if (error) throw error;
        if (alsoBanAuthor && authorId) await supabaseAdmin.from("profiles").update({ banned: true }).eq("id", authorId);
        if (reportId) await supabaseAdmin.from("reports").update({ status: "reviewed" }).eq("id", reportId);
        return NextResponse.json({ ok: true });
      }

      case "hideMessage": {
        const { targetId, reportId, alsoBanAuthor, authorId } = body;
        const { error } = await supabaseAdmin.from("messages").update({ hidden: true }).eq("id", targetId);
        if (error) throw error;
        if (alsoBanAuthor && authorId) await supabaseAdmin.from("profiles").update({ banned: true }).eq("id", authorId);
        if (reportId) await supabaseAdmin.from("reports").update({ status: "reviewed" }).eq("id", reportId);
        return NextResponse.json({ ok: true });
      }

      case "ignore": {
        const { reportId } = body;
        const { error } = await supabaseAdmin.from("reports").update({ status: "reviewed" }).eq("id", reportId);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    console.error("Admin API error:", action, err?.message, err?.code);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
