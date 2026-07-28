"use client";
import { useState } from "react";

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
  tab: (active) => ({
    padding: "8px 18px", borderRadius: 999, border: "none", cursor: "pointer",
    fontWeight: active ? 600 : 400, fontSize: 13,
    background: active ? "#4A2F3D" : "#fff",
    color: active ? "#fff" : "#8C7480",
    border: active ? "none" : "1px solid #EBDDD2",
  }),
};

const TYPE_LABEL = { user: "举报用户", post: "举报帖子", message: "举报消息" };
const TYPE_PILL  = { user: "#C9755A", post: "#7E9484", message: "#8C7480" };

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [activeTab, setActiveTab] = useState("open"); // "open" | "reviewed"
  const [reports, setReports] = useState([]);
  const [reviewedReports, setReviewedReports] = useState([]);
  const [profiles, setProfiles] = useState({});   // id → { nickname, avatar, banned }
  const [contents, setContents] = useState({});   // target_id → body string
  const [authorIds, setAuthorIds] = useState({}); // target_id → author_id (for post/message)
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", ok: true });

  // All reads/writes go through /api/admin (server-side, service role key).
  // The password is verified server-side on every call — nothing admin-only
  // is ever trusted to the browser.
  const callAdmin = async (action, payload = {}) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, action, ...payload }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return res.json();
  };

  const login = async () => {
    if (!pw) { setPwError(true); return; }
    setLoading(true);
    try {
      const data = await callAdmin("list");
      setReports(data.open || []);
      setReviewedReports(data.reviewed || []);
      setProfiles(data.profiles || {});
      setContents(data.contents || {});
      setAuthorIds(data.authorIds || {});
      setAuthed(true);
      setPwError(false);
    } catch (err) {
      console.error("Admin login error:", err?.message);
      setPwError(true);
    } finally {
      setLoading(false);
    }
  };

  const flash = (text, ok = true) => { setStatusMsg({ text, ok }); setTimeout(() => setStatusMsg({ text: "", ok: true }), 3000); };
  const removeOpen = (reportId) => setReports((prev) => prev.filter((r) => r.id !== reportId));

  const banUser = async (targetId, reportId) => {
    try {
      await callAdmin("ban", { targetId, reportId });
      setProfiles((prev) => ({ ...prev, [targetId]: { ...prev[targetId], banned: true } }));
      if (reportId) removeOpen(reportId);
      flash("✅ 用户已封禁");
    } catch (err) {
      console.error("Ban error:", err?.message); flash("❌ 操作失败", false);
    }
  };

  const unbanUser = async (targetId) => {
    try {
      await callAdmin("unban", { targetId });
      setProfiles((prev) => ({ ...prev, [targetId]: { ...prev[targetId], banned: false } }));
      flash("✅ 已解除封禁");
    } catch (err) {
      console.error("Unban error:", err?.message); flash("❌ 操作失败", false);
    }
  };

  const hidePost = async (targetId, reportId, alsobanAuthor) => {
    try {
      await callAdmin("hidePost", { targetId, reportId, alsoBanAuthor: alsobanAuthor, authorId: authorIds[targetId] });
      removeOpen(reportId);
      flash(alsobanAuthor ? "✅ 帖子已隐藏，作者已封禁" : "✅ 帖子已隐藏");
    } catch (err) {
      console.error("Hide post error:", err?.message); flash("❌ 操作失败", false);
    }
  };

  const hideMessage = async (targetId, reportId, alsobanAuthor) => {
    try {
      await callAdmin("hideMessage", { targetId, reportId, alsoBanAuthor: alsobanAuthor, authorId: authorIds[targetId] });
      removeOpen(reportId);
      flash(alsobanAuthor ? "✅ 消息已隐藏，作者已封禁" : "✅ 消息已隐藏");
    } catch (err) {
      console.error("Hide message error:", err?.message); flash("❌ 操作失败", false);
    }
  };

  const ignoreReport = async (reportId) => {
    try {
      await callAdmin("ignore", { reportId });
      removeOpen(reportId);
      flash("已忽略该举报");
    } catch (err) {
      console.error("Ignore error:", err?.message); flash("❌ 操作失败", false);
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

  const displayRows = activeTab === "open" ? reports : reviewedReports;

  return (
    <div style={S.wrap}>
      <div style={S.h1}>🛡 Galene Admin</div>
      <div style={{ ...S.sub, marginBottom: 16 }}>
        待处理 <strong style={{ color: "#C9755A" }}>{reports.length}</strong> 条 ·
        已处理 <strong style={{ color: "#7E9484" }}>{reviewedReports.length}</strong> 条（最近 50 条）
      </div>

      {statusMsg.text && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 10, fontSize: 13,
          background: statusMsg.ok ? "#F0FDF4" : "#FFF0EC",
          border: `1px solid ${statusMsg.ok ? "#A7F3D0" : "#F5C6C0"}`,
          color: statusMsg.ok ? "#065F46" : "#C9755A" }}>
          {statusMsg.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button style={S.tab(activeTab === "open")} onClick={() => setActiveTab("open")}>
          待处理 {reports.length > 0 && `(${reports.length})`}
        </button>
        <button style={S.tab(activeTab === "reviewed")} onClick={() => setActiveTab("reviewed")}>
          已处理
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#8C7480", fontSize: 14 }}>载入中…</div>
      ) : displayRows.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", color: "#8C7480", fontSize: 14, padding: 40 }}>
          {activeTab === "open" ? "🌿 没有待处理的举报" : "暂无已处理记录"}
        </div>
      ) : (
        displayRows.map((r) => {
          const isUserReport = r.target_type === "user";
          const targetProfile = isUserReport ? profiles[r.target_id] : null;
          const contentAuthorId = authorIds[r.target_id];
          const contentAuthor = contentAuthorId ? profiles[contentAuthorId] : null;
          const body = contents[r.target_id];
          const reporter = profiles[r.reporter_id];
          const isOpen = activeTab === "open";
          return (
            <div key={r.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={S.pill(TYPE_PILL[r.target_type] || "#8C7480")}>
                    {TYPE_LABEL[r.target_type] || r.target_type}
                  </span>
                  {!isOpen && <span style={S.pill("#7E9484")}>已处理</span>}
                  {targetProfile?.banned && <span style={S.pill("#6B7280")}>已封禁</span>}
                  {contentAuthor?.banned && <span style={S.pill("#6B7280")}>作者已封禁</span>}
                </div>
                <div style={{ fontSize: 11, color: "#8C7480", flexShrink: 0, marginLeft: 8 }}>
                  {new Date(r.created_at).toLocaleString("zh-CN")}
                </div>
              </div>

              {/* User target */}
              {targetProfile && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                  background: "#FBF3EC", borderRadius: 10, padding: "10px 12px" }}>
                  <span style={{ fontSize: 22 }}>{targetProfile.avatar || "🌿"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "#4A2F3D", fontWeight: 500 }}>
                      {targetProfile.nickname || "匿名"}{targetProfile.banned ? " 🔴" : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "#8C7480" }}>ID: {r.target_id.slice(0, 12)}…</div>
                  </div>
                </div>
              )}

              {/* Post / message content */}
              {(r.target_type === "post" || r.target_type === "message") && (
                <div style={{ marginBottom: 10, background: "#FBF3EC", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#8C7480", marginBottom: 4 }}>
                    {r.target_type === "post" ? "帖子内容" : "消息内容"}
                  </div>
                  <div style={{ fontSize: 13.5, color: "#4A2F3D", lineHeight: 1.6, wordBreak: "break-all" }}>
                    {body ?? <span style={{ color: "#8C7480" }}>（内容已删除或不可用）</span>}
                  </div>
                  {contentAuthor && (
                    <div style={{ fontSize: 11, color: "#8C7480", marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                      <span>作者：{contentAuthor.avatar} {contentAuthor.nickname || "匿名"}</span>
                      {contentAuthor.banned && <span style={S.pill("#6B7280")}>已封禁</span>}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#8C7480", marginTop: 2 }}>
                    内容 ID: {r.target_id?.slice(0, 12)}…
                  </div>
                </div>
              )}

              {/* Report reason + reporter */}
              <div style={{ fontSize: 13, color: "#4A2F3D", marginBottom: 14,
                background: "#FDF1E8", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ color: "#8C7480", fontSize: 11 }}>举报原因：</span>
                {r.reason || "（未填写）"}
                {r.note && <div style={{ marginTop: 4, fontSize: 12, color: "#8C7480" }}>补充：{r.note}</div>}
                {reporter && (
                  <div style={{ marginTop: 4, fontSize: 11, color: "#8C7480" }}>
                    举报人：{reporter.avatar} {reporter.nickname || "匿名"} · ID {r.reporter_id?.slice(0, 8)}…
                  </div>
                )}
              </div>

              {isOpen && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.target_type === "user" && !targetProfile?.banned && (
                    <button onClick={() => banUser(r.target_id, r.id)} style={S.btn("#C9755A")}>封禁用户</button>
                  )}
                  {r.target_type === "user" && targetProfile?.banned && (
                    <button onClick={() => unbanUser(r.target_id)} style={S.btn("#7E9484")}>解除封禁</button>
                  )}
                  {r.target_type === "post" && (
                    <>
                      <button onClick={() => hidePost(r.target_id, r.id, false)} style={S.btn("#C9755A")}>隐藏帖子</button>
                      {contentAuthor && !contentAuthor.banned && (
                        <button onClick={() => hidePost(r.target_id, r.id, true)} style={S.btn("#8B2020")}>
                          隐藏 + 封禁作者
                        </button>
                      )}
                    </>
                  )}
                  {r.target_type === "message" && (
                    <>
                      <button onClick={() => hideMessage(r.target_id, r.id, false)} style={S.btn("#C9755A")}>隐藏消息</button>
                      {contentAuthor && !contentAuthor.banned && (
                        <button onClick={() => hideMessage(r.target_id, r.id, true)} style={S.btn("#8B2020")}>
                          隐藏 + 封禁作者
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => ignoreReport(r.id)} style={S.btnGhost}>忽略</button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
