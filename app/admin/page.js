"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

const S = {
  wrap: { minHeight: "100vh", background: "#FBF3EC", padding: "32px 24px",
    fontFamily: "-apple-system,sans-serif" },
  card: { background: "#fff", borderRadius: 16, padding: 20, marginBottom: 14,
    border: "1px solid #EBDDD2", boxShadow: "0 2px 8px rgba(74,47,61,.07)" },
  h1: { fontSize: 22, fontWeight: 700, color: "#4A2F3D", marginBottom: 4 },
  sub: { fontSize: 13, color: "#8C7480", marginBottom: 28 },
  pill: (color) => ({ display: "inline-block", fontSize: 11, padding: "3px 10px",
    borderRadius: 999, background: color + "22", color }),
  btn: (bg) => ({ padding: "8px 18px", borderRadius: 10, border: "none",
    background: bg, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 }),
  btnGhost: { padding: "8px 18px", borderRadius: 10, border: "1px solid #EBDDD2",
    background: "#fff", color: "#8C7480", fontSize: 13, cursor: "pointer" },
};

const TYPE_LABEL = { user: "举报用户", post: "举报帖子", message: "举报消息" };
const TYPE_PILL  = { user: "#C9755A", post: "#7E9484", message: "#8C7480" };

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState({});   // id → { nickname, avatar, banned }
  const [contents, setContents] = useState({});   // target_id → body string
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const login = () => {
    if (pw === ADMIN_PW && ADMIN_PW !== "") {
      setAuthed(true); setPwError(false);
    } else {
      setPwError(true);
    }
  };

  useEffect(() => {
    if (!authed) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: rData, error } = await supabase
          .from("reports")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const rows = rData || [];
        setReports(rows);

        // Fetch user profiles
        const userIds = [...new Set(
          rows.filter((r) => r.target_type === "user").map((r) => r.target_id)
        )];
        if (userIds.length > 0) {
          const { data: pData } = await supabase
            .from("profiles").select("id, nickname, avatar, banned").in("id", userIds);
          const map = {};
          (pData || []).forEach((p) => { map[p.id] = p; });
          setProfiles(map);
        }

        // Fetch post bodies
        const postIds = [...new Set(
          rows.filter((r) => r.target_type === "post").map((r) => r.target_id)
        )];
        if (postIds.length > 0) {
          const { data: postData } = await supabase
            .from("posts").select("id, body").in("id", postIds);
          const map = {};
          (postData || []).forEach((p) => { map[p.id] = p.body; });
          setContents((prev) => ({ ...prev, ...map }));
        }

        // Fetch message bodies
        const msgIds = [...new Set(
          rows.filter((r) => r.target_type === "message").map((r) => r.target_id)
        )];
        if (msgIds.length > 0) {
          const { data: msgData } = await supabase
            .from("messages").select("id, body").in("id", msgIds);
          const map = {};
          (msgData || []).forEach((m) => { map[m.id] = m.body; });
          setContents((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error("Admin load error:", err?.message, err?.code, err?.details, err?.hint, err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authed]);

  const flash = (msg) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(""), 3000); };

  const closeReport = (reportId) =>
    setReports((prev) => prev.filter((r) => r.id !== reportId));

  const markReviewed = async (reportId) => {
    const { error } = await supabase
      .from("reports").update({ status: "reviewed" }).eq("id", reportId);
    if (error) throw error;
  };

  const banUser = async (targetId, reportId) => {
    try {
      const { error } = await supabase
        .from("profiles").update({ banned: true }).eq("id", targetId);
      if (error) throw error;
      await markReviewed(reportId);
      setProfiles((prev) => ({ ...prev, [targetId]: { ...prev[targetId], banned: true } }));
      closeReport(reportId);
      flash("✅ 用户已封禁，举报已关闭");
    } catch (err) {
      console.error("Ban error:", err?.message, err?.code, err?.details, err?.hint, err);
      flash("❌ 操作失败，请查看控制台");
    }
  };

  const unbanUser = async (targetId) => {
    try {
      const { error } = await supabase
        .from("profiles").update({ banned: false }).eq("id", targetId);
      if (error) throw error;
      setProfiles((prev) => ({ ...prev, [targetId]: { ...prev[targetId], banned: false } }));
      flash("✅ 已解除封禁");
    } catch (err) {
      console.error("Unban error:", err?.message, err?.code, err?.details, err?.hint, err);
      flash("❌ 操作失败，请查看控制台");
    }
  };

  const hidePost = async (targetId, reportId) => {
    try {
      const { error } = await supabase
        .from("posts").update({ hidden: true }).eq("id", targetId);
      if (error) throw error;
      await markReviewed(reportId);
      closeReport(reportId);
      flash("✅ 帖子已隐藏，举报已关闭");
    } catch (err) {
      console.error("Hide post error:", err?.message, err?.code, err?.details, err?.hint, err);
      flash("❌ 操作失败，请查看控制台");
    }
  };

  const hideMessage = async (targetId, reportId) => {
    try {
      const { error } = await supabase
        .from("messages").update({ hidden: true }).eq("id", targetId);
      if (error) throw error;
      await markReviewed(reportId);
      closeReport(reportId);
      flash("✅ 消息已隐藏，举报已关闭");
    } catch (err) {
      console.error("Hide message error:", err?.message, err?.code, err?.details, err?.hint, err);
      flash("❌ 操作失败，请查看控制台");
    }
  };

  const ignoreReport = async (reportId) => {
    try {
      await markReviewed(reportId);
      closeReport(reportId);
      flash("已忽略该举报");
    } catch (err) {
      console.error("Ignore error:", err?.message, err?.code, err?.details, err?.hint, err);
      flash("❌ 操作失败，请查看控制台");
    }
  };

  if (!authed) {
    return (
      <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...S.card, width: 340, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={S.h1}>Galene Admin</div>
          <div style={{ ...S.sub, marginBottom: 20 }}>输入管理口令</div>
          <input
            type="password" value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="口令"
            style={{ width: "100%", boxSizing: "border-box",
              border: `1px solid ${pwError ? "#C9755A" : "#EBDDD2"}`,
              borderRadius: 10, padding: "11px 14px", fontSize: 15, outline: "none",
              marginBottom: 8, background: "#FBF3EC", color: "#4A2F3D" }}
          />
          {pwError && <div style={{ fontSize: 12, color: "#C9755A", marginBottom: 10 }}>口令错误</div>}
          <button onClick={login}
            style={{ ...S.btn("#C9755A"), width: "100%", padding: "12px 0", fontSize: 15 }}>
            进入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.h1}>🛡 Galene Admin</div>
      <div style={S.sub}>开放举报 · 仅管理员可见</div>

      {statusMsg && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 10,
          background: "#F0FDF4", border: "1px solid #A7F3D0", fontSize: 13, color: "#065F46" }}>
          {statusMsg}
        </div>
      )}

      {loading ? (
        <div style={{ color: "#8C7480", fontSize: 14 }}>载入中…</div>
      ) : reports.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", color: "#8C7480", fontSize: 14, padding: 40 }}>
          🌿 没有待处理的举报
        </div>
      ) : (
        reports.map((r) => {
          const targetProfile = r.target_type === "user" ? profiles[r.target_id] : null;
          const body = contents[r.target_id];
          return (
            <div key={r.id} style={S.card}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={S.pill(TYPE_PILL[r.target_type] || "#8C7480")}>
                    {TYPE_LABEL[r.target_type] || r.target_type}
                  </span>
                  {targetProfile?.banned && (
                    <span style={S.pill("#6B7280")}>已封禁</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#8C7480", flexShrink: 0, marginLeft: 8 }}>
                  {new Date(r.created_at).toLocaleString("zh-CN")}
                </div>
              </div>

              {/* User target info */}
              {targetProfile && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                  background: "#FBF3EC", borderRadius: 10, padding: "10px 12px" }}>
                  <span style={{ fontSize: 22 }}>{targetProfile.avatar || "🌿"}</span>
                  <div>
                    <div style={{ fontSize: 14, color: "#4A2F3D", fontWeight: 500 }}>
                      {targetProfile.nickname || "匿名"}
                    </div>
                    <div style={{ fontSize: 11, color: "#8C7480" }}>
                      ID: {r.target_id.slice(0, 8)}…
                    </div>
                  </div>
                </div>
              )}

              {/* Post / message content preview */}
              {(r.target_type === "post" || r.target_type === "message") && (
                <div style={{ marginBottom: 10, background: "#FBF3EC", borderRadius: 10,
                  padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#8C7480", marginBottom: 4 }}>
                    {r.target_type === "post" ? "帖子内容" : "消息内容"}
                  </div>
                  <div style={{ fontSize: 13.5, color: "#4A2F3D", lineHeight: 1.6,
                    wordBreak: "break-all" }}>
                    {body ?? <span style={{ color: "#8C7480" }}>（内容已删除或无法加载）</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#8C7480", marginTop: 6 }}>
                    ID: {r.target_id?.slice(0, 12)}…
                  </div>
                </div>
              )}

              {/* Report reason */}
              <div style={{ fontSize: 13, color: "#4A2F3D", marginBottom: 14,
                background: "#FDF1E8", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ color: "#8C7480", fontSize: 11 }}>举报原因：</span>
                {r.reason || "（未填写）"}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {r.target_type === "user" && !targetProfile?.banned && (
                  <button onClick={() => banUser(r.target_id, r.id)} style={S.btn("#C9755A")}>
                    封禁该用户
                  </button>
                )}
                {r.target_type === "user" && targetProfile?.banned && (
                  <button onClick={() => unbanUser(r.target_id)} style={S.btn("#7E9484")}>
                    解除封禁
                  </button>
                )}
                {r.target_type === "post" && (
                  <button onClick={() => hidePost(r.target_id, r.id)} style={S.btn("#C9755A")}>
                    隐藏帖子
                  </button>
                )}
                {r.target_type === "message" && (
                  <button onClick={() => hideMessage(r.target_id, r.id)} style={S.btn("#C9755A")}>
                    隐藏消息
                  </button>
                )}
                <button onClick={() => ignoreReport(r.id)} style={S.btnGhost}>
                  忽略
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
