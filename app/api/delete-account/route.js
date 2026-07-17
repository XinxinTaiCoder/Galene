import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Lazily creates the admin client so missing env var doesn't crash at build time.
// Add SUPABASE_SERVICE_ROLE_KEY to .env.local (never commit it or expose to the client).
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
  const supabaseAdmin = getAdminClient();

  try {
    // Verify the requesting user's session via their access token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uid = user.id;

    // Resolve the user's message ids up front — `.in()` needs a real array,
    // it can't take a nested query builder (that throws synchronously).
    const { data: ownMessages, error: ownMessagesError } = await supabaseAdmin
      .from("messages").select("id").eq("author_id", uid);
    if (ownMessagesError) {
      console.error("Delete-account fetch messages error:", ownMessagesError.message);
    }
    const ownMessageIds = (ownMessages || []).map((m) => m.id);

    // Cascade delete in dependency order
    const steps = [
      () => supabaseAdmin.from("message_reactions").delete().eq("profile_id", uid),
      () => ownMessageIds.length
        ? supabaseAdmin.from("message_reactions").delete().in("message_id", ownMessageIds)
        : Promise.resolve({ error: null }),
      () => supabaseAdmin.from("notifications").delete().eq("recipient_id", uid),
      () => supabaseAdmin.from("notifications").delete().eq("actor_id", uid),
      () => supabaseAdmin.from("blocks").delete().eq("blocker_id", uid),
      () => supabaseAdmin.from("blocks").delete().eq("blocked_id", uid),
      () => supabaseAdmin.from("profile_hugs").delete().eq("from_id", uid),
      () => supabaseAdmin.from("profile_hugs").delete().eq("to_id", uid),
      () => supabaseAdmin.from("reports").delete().eq("reporter_id", uid),
      () => supabaseAdmin.from("hugs").delete().eq("profile_id", uid),
      () => supabaseAdmin.from("comments").delete().eq("author_id", uid),
      () => supabaseAdmin.from("messages").delete().eq("author_id", uid),
      () => supabaseAdmin.from("posts").delete().eq("author_id", uid),
      () => supabaseAdmin.from("profiles").delete().eq("id", uid),
    ];

    for (const step of steps) {
      const { error } = await step();
      if (error) {
        console.error("Delete-account step error:", error.message, error.code);
        // Continue — partial failures are better than stopping mid-cascade
      }
    }

    // Finally delete the auth user (requires service role)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (deleteAuthError) {
      console.error("Delete auth user error:", deleteAuthError.message);
      return NextResponse.json({ error: "Failed to delete auth user" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete account exception:", err?.message, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
