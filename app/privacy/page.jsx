export const metadata = {
  title: "隐私政策 · Privacy Policy — Galene",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", fontFamily: "system-ui,sans-serif", color: "#2d1f28", lineHeight: 1.75 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>隐私政策</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 36 }}>English version below · 最后更新：2026 年 7 月</p>

      <section>
        <h2>1. 我们收集什么信息</h2>
        <p>Galene 是一个匿名社群——你展示给其他用户的身份（昵称、头像）始终是匿名的。我们尽可能少地收集个人信息，具体包括：</p>
        <ul>
          <li><strong>账号信息</strong>：注册时你提供的邮箱地址和密码。密码由 Supabase Auth 加密存储，我们无法以明文查看；邮箱地址仅用于登录验证、找回密码及必要的账号通知。</li>
          <li><strong>用户生成内容</strong>：你在「分享」发布的帖子、在倾诉房间发送的消息、发表的评论，以及你选择的头像（Emoji）和昵称。</li>
          <li><strong>互动数据</strong>：你对帖子和用户的「抱抱」、屏蔽记录、举报记录、通知。</li>
          <li><strong>设备信息</strong>：App 崩溃日志（由 Supabase 平台自动收集，不含任何可识别信息）。</li>
        </ul>
        <p>我们<strong>不</strong>收集：真实姓名、手机号、位置信息、联系人列表、摄像头/麦克风数据（除非你主动上传图片）。你的邮箱地址<strong>绝不会展示给其他用户</strong>，也不会被用于在平台内公开识别你的身份。</p>

        <h2>2. 信息如何使用</h2>
        <ul>
          <li>提供 App 功能（发帖、聊天、通知等）</li>
          <li>维护社群安全（关键词检测、人工审核举报、封禁违规账号）</li>
          <li>改善产品体验</li>
        </ul>
        <p>我们<strong>不</strong>出售、不交易你的任何数据。</p>

        <h2>3. 数据存储与安全</h2>
        <p>所有数据存储在 <a href="https://supabase.com" target="_blank" rel="noopener">Supabase</a> 提供的云数据库中，服务器位于美国（AWS us-east-1）。Supabase 遵循 SOC 2 Type II 安全标准。传输过程全程使用 TLS 加密。</p>
        <p>我们使用 Google Cloud Translation API 提供翻译功能，翻译请求不会包含用户身份信息。</p>

        <h2>4. 你的权利</h2>
        <ul>
          <li><strong>查看与导出</strong>：你可以通过 App 查看自己发布的所有内容。</li>
          <li><strong>删除账号</strong>：你可以在「我的 → 删除账号」中永久删除账号及所有相关数据（帖子、消息、评论、互动记录、通知等）。删除操作不可撤销。</li>
          <li><strong>更正</strong>：你可以随时编辑自己的昵称和头像，也可以通过「忘记密码」随时重置登录密码。</li>
        </ul>

        <h2>5. 未成年人保护</h2>
        <p>Galene 仅向 17 岁及以上用户开放。我们不会有意收集未成年人数据。若你认为某位未成年人正在使用本服务，请通过下方联系方式告知我们。</p>

        <h2>6. 第三方服务</h2>
        <ul>
          <li><a href="https://supabase.com/privacy" target="_blank" rel="noopener">Supabase 隐私政策</a></li>
          <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google 隐私政策</a>（翻译功能）</li>
        </ul>

        <h2>7. 政策更新</h2>
        <p>我们可能不定期更新本政策。重大变更会通过 App 内通知告知用户。继续使用 App 即表示你接受更新后的政策。</p>

        <h2>8. 联系我们</h2>
        <p>如有任何隐私相关问题，请发送邮件至：<a href="mailto:privacy@galene.app">privacy@galene.app</a></p>
      </section>

      <hr style={{ margin: "56px 0", border: "none", borderTop: "1px solid #e8ddd5" }} />

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 36 }}>Last updated: July 2026</p>

      <section>
        <h2>1. What We Collect</h2>
        <p>Galene is an anonymous community app — the identity you show other users (nickname, avatar) is always anonymous. We collect as little personal information as possible:</p>
        <ul>
          <li><strong>Account information</strong>: The email address and password you provide when signing up. Your password is encrypted by Supabase Auth and never visible to us in plain text; your email is used only for login verification, password recovery, and necessary account notices.</li>
          <li><strong>User-generated content</strong>: Posts you share, messages you send in confide rooms, comments, and your chosen avatar (emoji) and nickname.</li>
          <li><strong>Interaction data</strong>: Hugs you send to posts and profiles, block records, reports, and notifications.</li>
          <li><strong>Device information</strong>: Crash logs automatically collected by Supabase — no personally identifiable data.</li>
        </ul>
        <p>We do <strong>not</strong> collect: real name, phone number, location, contacts, or camera/microphone data (unless you choose to upload a photo). Your email address is <strong>never shown to other users</strong> and is never used to publicly identify you on the platform.</p>

        <h2>2. How We Use It</h2>
        <ul>
          <li>Provide App functionality (posting, chat, notifications, etc.)</li>
          <li>Maintain community safety (keyword detection, human moderation of reports, banning violating accounts)</li>
          <li>Improve the product experience</li>
        </ul>
        <p>We do <strong>not</strong> sell or trade your data.</p>

        <h2>3. Data Storage &amp; Security</h2>
        <p>All data is stored on <a href="https://supabase.com" target="_blank" rel="noopener">Supabase</a> cloud infrastructure hosted in the United States (AWS us-east-1). Supabase is SOC 2 Type II certified. All data is transmitted over TLS.</p>
        <p>We use the Google Cloud Translation API for the translation feature. Translation requests contain no user identity information.</p>

        <h2>4. Your Rights</h2>
        <ul>
          <li><strong>Access &amp; export</strong>: You can view all content you have published directly in the App.</li>
          <li><strong>Delete account</strong>: You can permanently delete your account and all associated data (posts, messages, comments, interactions, notifications) via <em>Me → Delete Account</em>. Deletion is irreversible.</li>
          <li><strong>Correction</strong>: You can update your nickname and avatar at any time, and reset your password at any time via "Forgot password."</li>
        </ul>

        <h2>5. Children</h2>
        <p>Galene is intended for users 17 and older. We do not knowingly collect data from minors. If you believe a minor is using the service, please contact us.</p>

        <h2>6. Third-Party Services</h2>
        <ul>
          <li><a href="https://supabase.com/privacy" target="_blank" rel="noopener">Supabase Privacy Policy</a></li>
          <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a> (translation feature)</li>
        </ul>

        <h2>7. Changes to This Policy</h2>
        <p>We may update this policy from time to time. We will notify users of significant changes via in-app notice. Continued use of the App constitutes acceptance of the updated policy.</p>

        <h2>8. Contact Us</h2>
        <p>For any privacy-related questions, email us at: <a href="mailto:privacy@galene.app">privacy@galene.app</a></p>
      </section>
    </div>
  );
}
