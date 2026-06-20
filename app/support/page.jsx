export const metadata = {
  title: "帮助与支持 · Support — Galene",
};

export default function SupportPage() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px", fontFamily: "system-ui,sans-serif", color: "#2d1f28", lineHeight: 1.75 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>帮助与支持</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 36 }}>Help &amp; Support · English below</p>

      <section>
        <h2>联系我们</h2>
        <p>如有任何问题、反馈或账号相关事宜，请发送邮件至：<br />
          <a href="mailto:support@galene.app" style={{ color: "#C9755A" }}>support@galene.app</a>
        </p>
        <p>我们通常在 1-3 个工作日内回复。</p>

        <h2>心理健康危机资源</h2>
        <p>如果你或你认识的人正处于心理健康危机中，请立即联系专业机构：</p>
        <ul>
          <li><strong>中国大陆</strong>：北京心理危机研究与干预中心 <strong>010-82951332</strong>（24 小时）</li>
          <li><strong>台湾</strong>：自杀防治专线 <strong>1925</strong>（24 小时）</li>
          <li><strong>香港</strong>：撒玛利亚防止自杀会 <strong>2389 2222</strong>（24 小时）</li>
          <li><strong>美国</strong>：Suicide &amp; Crisis Lifeline，拨打或发短信 <strong>988</strong>（24 小时）</li>
          <li><strong>英国</strong>：Samaritans <strong>116 123</strong>（24 小时）</li>
        </ul>
        <p>Galene 是同伴情感支持社群，<strong>不</strong>提供心理健康医疗建议或危机干预服务。</p>

        <h2>删除账号</h2>
        <p>你可以随时在 App 内「我的 → 删除账号」中永久删除你的账号和所有数据。</p>
        <p>如果你无法访问 App，请发邮件至 <a href="mailto:support@galene.app" style={{ color: "#C9755A" }}>support@galene.app</a> 说明情况，我们将手动处理。</p>

        <h2>举报问题内容</h2>
        <p>你可以直接在 App 内通过「Flag」图标举报违规帖子，或通过举报功能举报违规用户。我们通常在 24 小时内处理举报。</p>
        <p>紧急情况（如威胁人身安全的内容）请同时发邮件至 <a href="mailto:support@galene.app" style={{ color: "#C9755A" }}>support@galene.app</a>，标题注明「紧急」。</p>

        <h2>隐私与数据</h2>
        <p>
          <a href="/privacy" style={{ color: "#C9755A" }}>隐私政策</a>
          {" · "}
          <a href="/terms" style={{ color: "#C9755A" }}>用户协议</a>
        </p>
      </section>

      <hr style={{ margin: "52px 0", border: "none", borderTop: "1px solid #e8ddd5" }} />

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Help &amp; Support</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 36 }}>中文版见上方</p>

      <section>
        <h2>Contact Us</h2>
        <p>For questions, feedback, or account issues, email us at:<br />
          <a href="mailto:support@galene.app" style={{ color: "#C9755A" }}>support@galene.app</a>
        </p>
        <p>We typically respond within 1-3 business days.</p>

        <h2>Mental Health Crisis Resources</h2>
        <p>If you or someone you know is in a mental health crisis, please reach out to a professional immediately:</p>
        <ul>
          <li><strong>US</strong>: Suicide &amp; Crisis Lifeline — call or text <strong>988</strong> (24/7)</li>
          <li><strong>UK</strong>: Samaritans — <strong>116 123</strong> (24/7)</li>
          <li><strong>Canada</strong>: Crisis Services Canada — <strong>1-833-456-4566</strong> (24/7)</li>
          <li><strong>Australia</strong>: Lifeline — <strong>13 11 14</strong> (24/7)</li>
          <li><strong>China</strong>: Beijing Crisis Center — <strong>010-82951332</strong> (24/7)</li>
        </ul>
        <p>Galene is a peer emotional support community. We do <strong>not</strong> provide professional mental health advice or crisis intervention.</p>

        <h2>Delete Your Account</h2>
        <p>You can permanently delete your account and all associated data at any time via <em>Me → Delete Account</em> in the App.</p>
        <p>If you cannot access the App, email <a href="mailto:support@galene.app" style={{ color: "#C9755A" }}>support@galene.app</a> and we will handle it manually.</p>

        <h2>Report Harmful Content</h2>
        <p>Use the Flag icon on any post to report it, or use the Report button on any user profile. We typically review reports within 24 hours.</p>
        <p>For urgent safety concerns, also email <a href="mailto:support@galene.app" style={{ color: "#C9755A" }}>support@galene.app</a> with "URGENT" in the subject line.</p>

        <h2>Privacy &amp; Data</h2>
        <p>
          <a href="/privacy" style={{ color: "#C9755A" }}>Privacy Policy</a>
          {" · "}
          <a href="/terms" style={{ color: "#C9755A" }}>Terms of Service</a>
        </p>
      </section>
    </div>
  );
}
