create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  headline text,
  bio text,
  location text,
  target_role text,
  years_experience numeric,
  avatar_path text,
  is_public boolean not null default false,
  public_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (btrim(display_name) <> ''),
  constraint profiles_public_slug_unique unique (public_slug),
  constraint profiles_public_slug_format check (
    public_slug is null or public_slug ~ '^[A-Za-z0-9_-]{12,64}$'
  ),
  constraint profiles_public_share_requires_slug check (
    is_public = false or public_slug is not null
  )
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text,
  self_reported_level text not null default 'unsure',
  description text,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_name_not_blank check (btrim(name) <> ''),
  constraint skills_level_allowed check (
    self_reported_level in ('beginner', 'intermediate', 'advanced', 'unsure')
  ),
  constraint skills_source_allowed check (source in ('user', 'ai_suggestion', 'import'))
);

create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  evidence_type text not null,
  description text,
  source_url text,
  storage_path text,
  mime_type text,
  processing_status text not null default 'pending',
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  constraint evidence_title_not_blank check (btrim(title) <> ''),
  constraint evidence_type_allowed check (
    evidence_type in ('project_url', 'github_url', 'document', 'text_sample')
  ),
  constraint evidence_processing_status_allowed check (
    processing_status in ('pending', 'processed', 'failed')
  ),
  constraint evidence_visibility_allowed check (visibility in ('private', 'public')),
  constraint evidence_source_or_storage_present check (
    (evidence_type in ('project_url', 'github_url') and source_url is not null)
    or (evidence_type in ('document', 'text_sample') and
        (storage_path is not null or description is not null))
  )
);

create table if not exists public.skill_evidence (
  skill_id uuid not null references public.skills(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  relationship_note text,
  created_at timestamptz not null default now(),
  primary key (skill_id, evidence_id)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text not null,
  instructions text not null,
  rubric jsonb not null,
  difficulty text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint assessments_title_not_blank check (btrim(title) <> ''),
  constraint assessments_description_not_blank check (btrim(description) <> ''),
  constraint assessments_instructions_not_blank check (btrim(instructions) <> ''),
  constraint assessments_difficulty_allowed check (
    difficulty in ('beginner', 'intermediate', 'advanced')
  ),
  constraint assessments_rubric_object check (jsonb_typeof(rubric) = 'object')
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  submission_text text,
  submission_url text,
  status text not null default 'started',
  total_score numeric,
  feedback jsonb,
  assessment_method text not null default 'ai_assisted',
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint assessment_attempt_status_allowed check (
    status in ('started', 'submitted', 'processing', 'completed', 'failed')
  ),
  constraint assessment_attempt_method_allowed check (
    assessment_method in ('ai_assisted', 'human_review')
  ),
  constraint assessment_attempt_total_score_nonnegative check (
    total_score is null or total_score >= 0
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger skills_set_updated_at
before update on public.skills
for each row execute function public.set_updated_at();
