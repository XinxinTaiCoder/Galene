// Sends an admin email via Resend whenever a new user signs up, a new post
// is published, or a new confide/chat message is sent. Invoked by pg_net
// triggers on auth.users / public.posts / public.messages (see
// supabase/admin_notify_triggers.sql). Deployed with --no-verify-jwt since
// the trigger calls it directly with the service role key, same as
// miss-galene-auto-reply.

const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFY_EMAIL') || 'galene_support@proton-mail.com'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Galene <onboarding@resend.dev>'

function esc(s: unknown) {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
  return String(s ?? '').replace(/[&<>]/g, (c) => map[c])
}

async function sendEmail(subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error('admin-notify: RESEND_API_KEY not set, skipping email:', subject)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to: [ADMIN_EMAIL], subject, html }),
  })
  if (!res.ok) {
    console.error('admin-notify: Resend error', res.status, await res.text())
  }
}

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')

Deno.serve(async (req) => {
  if (!WEBHOOK_SECRET || req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 })
  }
  try {
    const payload = await req.json()
    const table = payload.table
    const record = payload.record
    if (!record) return new Response('skip', { status: 200 })

    let subject = ''
    let html = ''

    if (table === 'users') {
      subject = `🆕 新用户注册：${record.email || record.id}`
      html = `<p>Galene 有新用户注册</p>
        <p>邮箱：${esc(record.email)}</p>
        <p>用户 ID：${esc(record.id)}</p>
        <p>时间：${esc(record.created_at)}</p>`
    } else if (table === 'posts') {
      subject = '📝 Galene 新帖子发布'
      html = `<p>有新帖子发布</p>
        <p>作者 ID：${esc(record.author_id)}</p>
        <p>内容：${esc(record.body)}</p>
        <p>标签：${esc(record.tag)}</p>
        <p>帖子 ID：${esc(record.id)}</p>`
    } else if (table === 'messages') {
      subject = '💬 Galene 新 confide 消息'
      html = `<p>聊天室有新消息</p>
        <p>房间：${esc(record.room_slug)}</p>
        <p>作者 ID：${esc(record.author_id)}</p>
        <p>内容：${esc(record.body)}</p>
        <p>消息 ID：${esc(record.id)}</p>`
    } else {
      return new Response('skip: unknown table', { status: 200 })
    }

    await sendEmail(subject, html)
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('admin-notify error:', (err as Error).message)
    return new Response((err as Error).message, { status: 500 })
  }
})
