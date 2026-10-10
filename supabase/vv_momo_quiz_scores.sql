-- MoMo quiz leaderboard for Virtual Visit.
-- Applied on the Vivis Ver 2 Supabase project. Safe to re-run.
-- Same public-demo trust model as vv_game_scores: anon may select and insert.

create table if not exists public.vv_momo_quiz_scores (
  id uuid primary key default gen_random_uuid(),
  room_id text not null check (char_length(room_id) between 1 and 32),
  player_name text not null check (char_length(player_name) between 1 and 30),
  correct smallint not null check (correct between 0 and 5),
  total smallint not null default 5 check (total = 5),
  ms integer not null check (ms between 1000 and 900000),
  created_at timestamptz not null default now()
);

create index if not exists vv_momo_quiz_scores_room_rank_idx
  on public.vv_momo_quiz_scores (room_id, correct desc, ms);

alter table public.vv_momo_quiz_scores enable row level security;

drop policy if exists "vv_momo_quiz_scores_select" on public.vv_momo_quiz_scores;
create policy "vv_momo_quiz_scores_select"
  on public.vv_momo_quiz_scores for select
  to anon, authenticated
  using (true);

drop policy if exists "vv_momo_quiz_scores_insert" on public.vv_momo_quiz_scores;
create policy "vv_momo_quiz_scores_insert"
  on public.vv_momo_quiz_scores for insert
  to anon, authenticated
  with check (true);
