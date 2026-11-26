alter table public.evidence
add column if not exists reviewer_consent boolean not null default false;

create table if not exists public.authorized_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  is_active boolean not null default true
);

alter table public.authorized_reviewers enable row level security;
revoke all on table public.authorized_reviewers from public, anon, authenticated;
grant select, insert, update, delete on table public.authorized_reviewers to service_role;

alter table public.review_records
add column if not exists reviewed_material text[] not null default '{}';

alter table public.review_records
drop constraint if exists review_records_reviewed_material_allowed;

alter table public.review_records
add constraint review_records_reviewed_material_allowed check (
  reviewed_material <@ array['description', 'source_url', 'private_file']::text[]
);

create index if not exists evidence_reviewer_queue_idx
on public.evidence (created_at desc)
where reviewer_consent = true;

create index if not exists review_records_evidence_reviewer_idx
on public.review_records (evidence_id, reviewer_id, reviewed_at desc);

create unique index if not exists review_records_one_per_reviewer_idx
on public.review_records (evidence_id, reviewer_id);

create or replace function public.record_evidence_review(
  p_reviewer_id uuid,
  p_evidence_id uuid,
  p_decision text,
  p_notes text,
  p_reviewed_material text[]
)
returns table (
  id uuid,
  evidence_id uuid,
  reviewer_id uuid,
  decision text,
  notes text,
  reviewed_material text[],
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_evidence public.evidence%rowtype;
begin
  if not exists (
    select 1
    from public.authorized_reviewers ar
    where ar.user_id = p_reviewer_id
      and ar.is_active = true
  ) then
    raise exception 'Reviewer is not authorized.' using errcode = '42501';
  end if;

  select * into v_evidence
  from public.evidence e
  where e.id = p_evidence_id
    and e.reviewer_consent = true;

  if not found then
    raise exception 'Evidence is unavailable or not consented for review.'
      using errcode = 'P0002';
  end if;

  if p_decision is null
    or p_decision not in ('accepted', 'needs_changes', 'rejected')
    or p_notes is null
    or char_length(btrim(p_notes)) > 1000
    or p_reviewed_material is null
    or cardinality(p_reviewed_material) < 1
    or cardinality(p_reviewed_material) > 3
    or cardinality(p_reviewed_material) <> (
      select count(distinct material)::integer
      from unnest(p_reviewed_material) as item(material)
    )
    or array_position(p_reviewed_material, null) is not null
    or not (
      p_reviewed_material <@ array['description', 'source_url', 'private_file']::text[]
    ) then
    raise exception 'The reviewer decision or reviewed material is invalid.'
      using errcode = '22023';
  end if;

  if 'description' = any(p_reviewed_material)
    and nullif(btrim(v_evidence.description), '') is null then
    raise exception 'The evidence description is unavailable.'
      using errcode = '22023';
  end if;
  if 'source_url' = any(p_reviewed_material)
    and (
      v_evidence.source_url is null
      or v_evidence.source_url !~* '^https://[^/@]+(?:/|$)'
      or (
        v_evidence.evidence_type = 'github_url'
        and v_evidence.source_url !~* '^https://github[.]com/[A-Za-z0-9-]+/[A-Za-z0-9_.-]+[.]?/?$'
      )
    ) then
    raise exception 'A safe HTTPS source URL is unavailable.'
      using errcode = '22023';
  end if;
  if 'private_file' = any(p_reviewed_material)
    and (
      v_evidence.storage_path is null
      or v_evidence.storage_path not like
        v_evidence.user_id::text || '/' || v_evidence.id::text || '/%'
    ) then
    raise exception 'The private file is unavailable.'
      using errcode = '22023';
  end if;

  return query
  insert into public.review_records as review (
    evidence_id,
    reviewer_id,
    decision,
    notes,
    reviewed_material
  )
  values (
    p_evidence_id,
    p_reviewer_id,
    p_decision,
    nullif(btrim(p_notes), ''),
    p_reviewed_material
  )
  returning
    review.id,
    review.evidence_id,
    review.reviewer_id,
    review.decision,
    review.notes,
    review.reviewed_material,
    review.reviewed_at;
end;
$$;

revoke all on function public.record_evidence_review(uuid, uuid, text, text, text[])
from public, anon, authenticated;
grant execute on function public.record_evidence_review(uuid, uuid, text, text, text[])
to service_role;

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
  ),
  constraint ai_processing_logs_error_code_length check (
    error_code is null or char_length(error_code) <= 64
  )
);

alter table public.ai_processing_logs enable row level security;

drop policy if exists "ai_processing_logs_select_own"
on public.ai_processing_logs;

create policy "ai_processing_logs_select_own"
on public.ai_processing_logs for select
to authenticated
using (user_id = auth.uid());

revoke all on table public.ai_processing_logs from public, anon, authenticated;
grant select on table public.ai_processing_logs to authenticated;
grant select, insert, update, delete on table public.ai_processing_logs to service_role;

create index if not exists ai_processing_logs_user_created_idx
on public.ai_processing_logs (user_id, created_at desc);

create or replace function public.get_impact_metrics()
returns table (
  profiles_created bigint,
  skills_added bigint,
  ai_suggested_skills_saved bigint,
  evidence_submitted bigint,
  assessments_started bigint,
  assessments_completed bigint,
  public_passports_shared bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    (select count(*) from public.profiles),
    (select count(*) from public.skills),
    (
      select count(*)
      from public.skills
      where source = 'ai_suggestion'
    ),
    (select count(*) from public.evidence),
    (select count(*) from public.assessment_attempts),
    (
      select count(*)
      from public.assessment_attempts
      where status = 'completed'
    ),
    (
      select count(*)
      from public.profiles
      where is_public = true
    );
$$;

revoke all on function public.get_impact_metrics() from public, anon;
grant execute on function public.get_impact_metrics() to authenticated;

insert into public.assessments (
  title,
  category,
  description,
  instructions,
  expected_deliverable,
  rubric,
  difficulty,
  is_active
)
select
  'Practical Data Analysis',
  'data_analysis',
  'Demonstrate basic data analysis through a concise, evidence-based interpretation of a small dataset.',
  'Review the provided sample of monthly service requests: January 42, February 38, March 55, and April 65. Describe the trend, calculate one meaningful comparison, identify one limitation of this small sample, and recommend a next step. Do not claim causation.',
  'Submit a short written analysis with a supported trend, one correct comparison, a limitation, and a cautious next step.',
  jsonb_build_object(
    'dimensions', jsonb_build_array(
      jsonb_build_object('criterion', 'Trend interpretation', 'max_score', 4, 'description', 'Describes the direction of change accurately using the supplied values.'),
      jsonb_build_object('criterion', 'Numerical comparison', 'max_score', 4, 'description', 'Uses at least one correct, relevant comparison based on the supplied values.'),
      jsonb_build_object('criterion', 'Evidence and reasoning', 'max_score', 4, 'description', 'Connects conclusions to the supplied data without adding unsupported facts.'),
      jsonb_build_object('criterion', 'Limitations', 'max_score', 4, 'description', 'Identifies a reasonable limitation of the small dataset.'),
      jsonb_build_object('criterion', 'Next step', 'max_score', 4, 'description', 'Recommends a cautious, practical next step without claiming causation.')
    ),
    'score_range', jsonb_build_object('minimum', 0, 'maximum', 4),
    'total_max_score', 20,
    'method_label', 'AI-assisted assessment',
    'limitations', 'This advisory result evaluates only the written response and supplied sample; it is not an official qualification.'
  ),
  'beginner',
  true
where not exists (
  select 1 from public.assessments where category = 'data_analysis'
);

insert into public.assessments (
  title,
  category,
  description,
  instructions,
  expected_deliverable,
  rubric,
  difficulty,
  is_active
)
select
  'Customer Support Scenario',
  'customer_support',
  'Demonstrate clear, empathetic problem-solving in a fictional customer support scenario.',
  'A customer says an online order is marked delivered but they cannot find it. Write a response that acknowledges the concern, asks only relevant follow-up questions, explains safe next steps, and avoids promising an outcome you cannot confirm.',
  'Submit a customer-facing response and briefly explain the next steps you would take.',
  jsonb_build_object(
    'dimensions', jsonb_build_array(
      jsonb_build_object('criterion', 'Empathy and tone', 'max_score', 4, 'description', 'Acknowledges the customer concern in a respectful, calm and helpful tone.'),
      jsonb_build_object('criterion', 'Clarifying questions', 'max_score', 4, 'description', 'Requests relevant information without unnecessary personal or sensitive details.'),
      jsonb_build_object('criterion', 'Practical next steps', 'max_score', 4, 'description', 'Provides safe and actionable steps appropriate to the scenario.'),
      jsonb_build_object('criterion', 'Accuracy and boundaries', 'max_score', 4, 'description', 'Avoids unsupported promises and distinguishes confirmed facts from unknowns.'),
      jsonb_build_object('criterion', 'Clarity', 'max_score', 4, 'description', 'Communicates in concise, understandable language.')
    ),
    'score_range', jsonb_build_object('minimum', 0, 'maximum', 4),
    'total_max_score', 20,
    'method_label', 'AI-assisted assessment',
    'limitations', 'This advisory result evaluates only the written response to a fictional scenario; it is not an official qualification.'
  ),
  'beginner',
  true
where not exists (
  select 1 from public.assessments where category = 'customer_support'
);
