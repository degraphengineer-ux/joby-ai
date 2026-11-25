create table if not exists public.review_records (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null,
  notes text,
  reviewed_at timestamptz not null default now(),
  constraint review_records_decision_allowed check (
    decision in ('accepted', 'needs_changes', 'rejected')
  )
);

alter table public.review_records enable row level security;

create policy "review_records_owner_evidence_select"
on public.review_records for select
to authenticated
using (
  exists (
    select 1
    from public.evidence e
    where e.id = review_records.evidence_id
      and e.user_id = auth.uid()
  )
  or reviewer_id = auth.uid()
);

create table if not exists public.ai_processing_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation_type text not null,
  status text not null,
  model_name text,
  error_code text,
  created_at timestamptz not null default now(),
  constraint ai_processing_logs_operation_allowed check (
    operation_type in ('skill_extraction', 'assessment_feedback')
  ),
  constraint ai_processing_logs_status_allowed check (
    status in ('started', 'succeeded', 'failed')
  )
);

alter table public.ai_processing_logs enable row level security;

create policy "ai_processing_logs_select_own"
on public.ai_processing_logs for select
to authenticated
using (user_id = auth.uid());
