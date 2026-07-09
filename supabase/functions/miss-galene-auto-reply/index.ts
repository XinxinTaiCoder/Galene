import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MISS_GALENE_ID = '00000000-0000-0000-0000-000000000001'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const post = payload.record

    if (!post || post.author_id === MISS_GALENE_ID) {
      return new Response('skip', { status: 200 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase.from('hugs').upsert({
      post_id: post.id,
      profile_id: MISS_GALENE_ID
    })

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: `You are Miss Galene, a warm and empathetic companion in a women-only anonymous peer support community. Make the user feel seen and not alone.
Guidelines:
- Respond in the same language as the user's post (Chinese or English).
- Keep it to 1-3 sentences. Be concise.
- Be genuine. Never say "I understand how you feel".
- Reflect what they actually said, don't be generic.
- No unsolicited advice.
- End with a gentle open question inviting them to share more.
- Never mention you are an AI unless directly asked.
Return only the reply text, nothing else.`,
        messages: [{
          role: 'user',
          content: `Someone just posted: "${post.body}". Write a warm reply.`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    const replyText = claudeData.content?.[0]?.text
    if (!replyText) throw new Error('No reply generated')

    await supabase.from('comments').insert({
      post_id: post.id,
      author_id: MISS_GALENE_ID,
      body: replyText
    })

    await supabase.from('notifications').insert({
      recipient_id: MISS_GALENE_ID,
      type: 'new_post_alert',
      ref_id: post.id,
      read: false
    })

    const { data: listeners } = await supabase
      .from('profiles')
      .select('id')
      .contains('strengths', ['good listener'])
      .neq('id', MISS_GALENE_ID)
      .neq('id', post.author_id)

    if (listeners && listeners.length > 0) {
      await supabase.from('notifications').insert(
        listeners.map((u: { id: string }) => ({
          recipient_id: u.id,
          type: 'peer_nudge',
          ref_id: post.id,
          read: false
        }))
      )
    }

    console.log('Miss Galene replied to post:', post.id)
    return new Response('ok', { status: 200 })

  } catch (err) {
    console.error('Miss Galene error:', (err as Error).message)
    return new Response((err as Error).message, { status: 500 })
  }
})
