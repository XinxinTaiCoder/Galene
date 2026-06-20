-- Run this in Supabase SQL Editor (Database → SQL Editor)
-- Creates push_tokens table for iOS push notification delivery

create table if not exists push_tokens (
  token        text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  platform     text not null default 'ios',
  updated_at   timestamptz not null default now()
);

-- Index to quickly look up tokens by user (for sending notifications)
create index if not exists push_tokens_user_id_idx on push_tokens(user_id);

-- RLS: users can only manage their own tokens; server uses service role to read all
alter table push_tokens enable row level security;

create policy "Users can upsert own token"
  on push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own token"
  on push_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own token"
  on push_tokens for delete
  using (auth.uid() = user_id);

-- Service role (used by push-send function) can read all tokens — no policy needed
-- because service role bypasses RLS.
