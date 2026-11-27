create table public.ai_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  skill_name text not null check (char_length(btrim(skill_name)) between 1 and 80),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  questions jsonb not null check (jsonb_typeof(questions) = 'array'),
  answers jsonb,
  score integer,
  total_questions integer not null check (total_questions = 5),
  results jsonb,
  status text not null default 'started' check (status in ('started', 'completed')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  constraint ai_quiz_completed_fields check (
    (status = 'started' and answers is null and score is null and results is null and submitted_at is null)
    or
    (status = 'completed' and answers is not null and score between 0 and total_questions and results is not null and submitted_at is not null)
  )
);

create index ai_quiz_sessions_user_created_at_idx
on public.ai_quiz_sessions (user_id, created_at desc);

alter table public.ai_quiz_sessions enable row level security;

revoke all on table public.ai_quiz_sessions
from public, anon, authenticated;

grant select, insert, update on table public.ai_quiz_sessions
to service_role;
