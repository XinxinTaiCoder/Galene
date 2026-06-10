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
  label: { fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em",
    color: "#8C7480", marginBottom: 6 },
  pill: (color) => ({ display: "inline-block", fontSize: 11, padding: "3px 10px",
    borderRadius: 999, background: color + "22", color }),
  btn: (bg) => ({ padding: "8px 18px", borderRadius: 10, border: "none",
    background: bg, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 }),
  btnGhost: { padding: "8px 18px", borderRadius: 10, border: "1px solid #EBDDD2",
    background: "#fff", color: "#8C7480", fontSize: 13, cursor: "pointer" },
};

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const login = () => {
    if (pw === ADMIN_PW && ADMIN_PW !== "") {
      setAuthed(true);
      setPwError(false);
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

        const userIds = [...new Set(
          rows.filter((r) => r.target_type === "user").map((r) => r.target_id)
        )];
        if (userIds.length > 0) {
          const { data: pData } = await supabase
            .from("profiles")
            .select("id, nickname, avatar, banned")
            .in("id", userIds);
          const map = {};
          (pData || []).forEach((p) => { map[p.id] = p; });
          setProfiles(map);
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

  const banUser = async (targetId, reportId) => {
    try {
      const { error: banErr } = await supabase
        .from("profiles").update({ banned: true }).eq("id", targetId);
      if (banErr) throw banErr;
      const { error: rptErr } = await supabase
        .from("reports").update({ status: "reviewed" }).eq("id", reportId);
      if (rptErr) throw rptErr;
      setProfiles((prev) => ({ ...prev, [targetId]: { ...prev[targetId], banned: true } }));
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      flash("✅ 用户已封禁，举报已关闭");
    } catch (err) {
      console.error("Ban error:", err?.message, err?.code, err?.details, err?.hint, err);
      flash("❌ 操作失败，请查看控制台");
    }
  };

  const ignoreReport = async (reportId) => {
    try {
      const { error } = await supabase
        .from("reports").update({ status: "reviewed" }).eq("id", reportId);
      if (error) throw error;
      setReports((prev) => prev.filter((r) => r.id !== reportId));
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
            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${pwError ? "#C9755A" : "#EBDDD2"}`,
              borderRadius: 10, padding: "11px 14px", fontSize: 15, outline: "none",
              marginBottom: 8, background: "#FBF3EC", color: "#4A2F3D" }}
          />
          {pwError && <div style={{ fontSize: 12, color: "#C9755A", marginBottom: 10 }}>口令错误</div>}
          <button onClick={login} style={{ ...S.btn("#C9755A"), width: "100%", padding: "12px 0", fontSize: 15 }}>
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
          return (
            <div key={r.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span style={S.pill("#C9755A")}>
                    {r.target_type === "user" ? "举报用户" : "举报帖子"}
                  </span>
                  {targetProfile?.banned && (
                    <span style={{ ...S.pill("#6B7280"), marginLeft: 8 }}>已封禁</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#8C7480" }}>
                  {new Date(r.created_at).toLocaleString("zh-CN")}
                </div>
              </div>

              {targetProfile && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                  background: "#FBF3EC", borderRadius: 10, padding: "10px 12px" }}>
                  <span style={{ fontSize: 22 }}>{targetProfile.avatar || "🌿"}</span>
                  <div>
                    <div style={{ fontSize: 14, color: "#4A2F3D", fontWeight: 500 }}>
                      {targetProfile.nickname || "匿名"}
                    </div>
                    <div style={{ fontSize: 11, color: "#8C7480" }}>ID: {r.target_id.slice(0, 8)}…</div>
                  </div>
                </div>
              )}

              {!targetProfile && r.target_type !== "user" && (
                <div style={{ fontSize: 12, color: "#8C7480", marginBottom: 10 }}>
                  目标 ID: {r.target_id?.slice(0, 12)}…
                </div>
              )}

              <div style={{ fontSize: 13, color: "#4A2F3D", marginBottom: 14,
                background: "#FDF1E8", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ color: "#8C7480", fontSize: 11 }}>举报原因：</span>
                {r.reason || "（未填写）"}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {r.target_type === "user" && !targetProfile?.banned && (
                  <button onClick={() => banUser(r.target_id, r.id)}
                    style={S.btn("#C9755A")}>
                    封禁该用户
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
