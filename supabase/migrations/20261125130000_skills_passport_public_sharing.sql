alter table public.evidence
add column if not exists updated_at timestamptz;

update public.evidence
set updated_at = created_at
where updated_at is null;

alter table public.evidence
alter column updated_at set default now(),
alter column updated_at set not null;

drop trigger if exists evidence_set_updated_at on public.evidence;

create trigger evidence_set_updated_at
before update on public.evidence
for each row execute function public.set_updated_at();

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

drop policy if exists "review_records_owner_evidence_select"
on public.review_records;

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

revoke all on table public.review_records from public, anon, authenticated;
grant select on table public.review_records to authenticated;
grant select, insert, update, delete on table public.review_records to service_role;

create table if not exists public.external_credential_verifications (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  credential_name text not null,
  provider text not null,
  verification_method text not null,
  verification_reference text not null,
  verified_by uuid not null references public.profiles(id) on delete restrict,
  verified_at timestamptz not null default now(),
  constraint external_credential_name_length check (
    char_length(btrim(credential_name)) between 1 and 120
  ),
  constraint external_credential_provider_length check (
    char_length(btrim(provider)) between 1 and 120
  ),
  constraint external_credential_method_length check (
    char_length(btrim(verification_method)) between 20 and 1000
  ),
  constraint external_credential_reference_length check (
    char_length(btrim(verification_reference)) between 1 and 512
  )
);

create index if not exists external_credential_verifications_evidence_idx
on public.external_credential_verifications (evidence_id, verified_at desc);

alter table public.external_credential_verifications enable row level security;

create policy "external_credential_verifications_owner_select"
on public.external_credential_verifications for select
to authenticated
using (
  exists (
    select 1
    from public.evidence e
    where e.id = external_credential_verifications.evidence_id
      and e.user_id = auth.uid()
  )
  or verified_by = auth.uid()
);

revoke all on table public.external_credential_verifications
from public, anon, authenticated;
grant select on table public.external_credential_verifications to authenticated;
grant select, insert, update, delete
on table public.external_credential_verifications to service_role;

create table if not exists public.passport_correction_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  contact_email text,
  created_at timestamptz not null default now(),
  constraint passport_correction_message_length check (
    char_length(btrim(message)) between 10 and 2000
  ),
  constraint passport_correction_email_length check (
    contact_email is null or char_length(contact_email) <= 254
  )
);

create index if not exists passport_correction_requests_profile_created_idx
on public.passport_correction_requests (profile_id, created_at desc);

alter table public.passport_correction_requests enable row level security;
revoke all on table public.passport_correction_requests
from public, anon, authenticated;
grant select, insert, update, delete on table public.passport_correction_requests
to service_role;

create or replace function public.get_public_passport_v2(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'display_name', p.display_name,
    'headline', p.headline,
    'bio', p.bio,
    'last_updated_at', greatest(
      p.updated_at,
      coalesce(
        (select max(s.updated_at) from public.skills s where s.user_id = p.id),
        p.updated_at
      ),
      coalesce(
        (
          select max(e.updated_at)
          from public.evidence e
          where e.user_id = p.id
            and e.visibility = 'public'
        ),
        p.updated_at
      ),
      coalesce(
        (
          select max(a.completed_at)
          from public.assessment_attempts a
          where a.user_id = p.id
            and a.status = 'completed'
            and a.completed_at is not null
        ),
        p.updated_at
      ),
      coalesce(
        (
          select max(r.reviewed_at)
          from public.review_records r
          join public.evidence e on e.id = r.evidence_id
          where e.user_id = p.id
            and e.visibility = 'public'
        ),
        p.updated_at
      )
    ),
    'skills', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name', s.name,
            'category', s.category,
            'proficiency', s.self_reported_level,
            'status_labels',
              jsonb_build_array('Self-reported')
              || case when exists (
                select 1
                from public.skill_evidence se
                join public.evidence e on e.id = se.evidence_id
                where se.skill_id = s.id
                  and e.visibility = 'public'
              ) then jsonb_build_array('Evidence submitted')
              else '[]'::jsonb end
              || case when exists (
                select 1
                from public.skill_evidence se
                join public.evidence e on e.id = se.evidence_id
                join public.review_records r on r.evidence_id = e.id
                where se.skill_id = s.id
                  and e.visibility = 'public'
              ) then jsonb_build_array('Human reviewed')
              else '[]'::jsonb end
              || case when exists (
                select 1
                from public.skill_evidence se
                join public.evidence e on e.id = se.evidence_id
                join public.external_credential_verifications v on v.evidence_id = e.id
                where se.skill_id = s.id
                  and e.visibility = 'public'
              ) then jsonb_build_array('External credential')
              else '[]'::jsonb end,
            'evidence', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'title', e.title,
                    'evidence_type', e.evidence_type,
                    'description', e.description,
                    'source_url', case
                      when e.evidence_type in ('project_url', 'github_url')
                        then e.source_url
                      else null
                    end,
                    'submitted_at', e.created_at,
                    'human_reviewed', exists (
                      select 1 from public.review_records r
                      where r.evidence_id = e.id
                    ),
                    'external_credential_verified', exists (
                      select 1 from public.external_credential_verifications v
                      where v.evidence_id = e.id
                    )
                  )
                  order by e.created_at desc
                )
                from public.skill_evidence se
                join public.evidence e on e.id = se.evidence_id
                where se.skill_id = s.id
                  and e.visibility = 'public'
              ),
              '[]'::jsonb
            )
          )
          order by s.name
        )
        from public.skills s
        where s.user_id = p.id
      ),
      '[]'::jsonb
    ),
    'other_evidence', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'title', e.title,
            'evidence_type', e.evidence_type,
            'description', e.description,
            'source_url', case
              when e.evidence_type in ('project_url', 'github_url')
                then e.source_url
              else null
            end,
            'submitted_at', e.created_at,
            'human_reviewed', exists (
              select 1 from public.review_records r
              where r.evidence_id = e.id
            ),
            'external_credential_verified', exists (
              select 1 from public.external_credential_verifications v
              where v.evidence_id = e.id
            )
          )
          order by e.created_at desc
        )
        from public.evidence e
        where e.user_id = p.id
          and e.visibility = 'public'
          and not exists (
            select 1 from public.skill_evidence se
            where se.evidence_id = e.id
          )
      ),
      '[]'::jsonb
    ),
    'assessments', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'title', a.title,
            'category', a.category,
            'completed_at', attempt.completed_at,
            'method_label', case attempt.assessment_method
              when 'human_review' then 'Human reviewed'
              else 'AI-assisted assessment'
            end,
            'score', attempt.total_score,
            'max_score', (attempt.feedback ->> 'total_max_score')::integer,
            'criteria', (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'criterion', criterion ->> 'criterion',
                    'score', (criterion ->> 'score')::integer,
                    'max_score', (criterion ->> 'max_score')::integer
                  )
                  order by criterion_order
                ),
                '[]'::jsonb
              )
              from jsonb_array_elements(
                case
                  when jsonb_typeof(attempt.feedback -> 'criteria') = 'array'
                    then attempt.feedback -> 'criteria'
                  else '[]'::jsonb
                end
              )
                with ordinality as criteria(criterion, criterion_order)
            )
          )
          order by attempt.completed_at desc
        )
        from public.assessment_attempts attempt
        join public.assessments a on a.id = attempt.assessment_id
        where attempt.user_id = p.id
          and attempt.status = 'completed'
          and attempt.total_score is not null
          and attempt.completed_at is not null
          and attempt.feedback is not null
          and attempt.total_score = trunc(attempt.total_score)
          and attempt.total_score between 0 and 48
          and jsonb_typeof(attempt.feedback -> 'criteria') = 'array'
          and attempt.feedback ->> 'total_max_score' ~ '^[1-9][0-9]?$'
          and (
            (attempt.assessment_method = 'ai_assisted'
              and attempt.feedback ->> 'method_label' = 'AI-assisted assessment')
            or
            (attempt.assessment_method = 'human_review'
              and attempt.feedback ->> 'method_label' = 'Human reviewed')
          )
          and case
            when jsonb_typeof(attempt.feedback -> 'criteria') = 'array' then not exists (
              select 1
              from jsonb_array_elements(attempt.feedback -> 'criteria') criterion
              where coalesce(criterion ->> 'criterion', '') = ''
                or coalesce(criterion ->> 'score', '') !~ '^(0|[1-4])$'
                or coalesce(criterion ->> 'max_score', '') !~ '^[1-4]$'
            )
            else false
          end
      ),
      '[]'::jsonb
    )
  )
  from public.profiles p
  where p.is_public = true
    and p.public_slug = p_slug
    and p_slug ~ '^[A-Za-z0-9_-]{12,64}$';
$$;

revoke all on function public.get_public_passport_v2(text)
from public, anon, authenticated;
grant execute on function public.get_public_passport_v2(text)
to anon, authenticated;

revoke all on function public.get_public_passport(text)
from public, anon, authenticated;

create or replace function public.submit_passport_correction_request(
  p_slug text,
  p_message text,
  p_contact_email text default null
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_profile_id uuid;
  v_recent_count integer;
begin
  if p_slug is null or p_slug !~ '^[A-Za-z0-9_-]{12,64}$' then
    raise exception 'This passport is not available.' using errcode = 'PT404';
  end if;

  if p_message is null
    or char_length(btrim(p_message)) < 10
    or char_length(p_message) > 2000
  then
    raise exception 'Enter a correction request between 10 and 2,000 characters.'
      using errcode = 'PT400';
  end if;

  if p_contact_email is not null and (
    char_length(p_contact_email) > 254
    or p_contact_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) then
    raise exception 'Enter a valid contact email address or leave it blank.'
      using errcode = 'PT400';
  end if;

  select p.id
  into v_profile_id
  from public.profiles p
  where p.is_public = true
    and p.public_slug = p_slug
  for key share;

  if v_profile_id is null then
    raise exception 'This passport is not available.' using errcode = 'PT404';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('passport-correction:' || v_profile_id::text, 0)
  );

  select count(*)::integer
  into v_recent_count
  from public.passport_correction_requests r
  where r.profile_id = v_profile_id
    and r.created_at > now() - interval '10 minutes';

  if v_recent_count >= 5 then
    raise exception 'Too many requests were submitted for this passport. Try again later.'
      using errcode = 'PT429';
  end if;

  insert into public.passport_correction_requests (
    profile_id,
    message,
    contact_email
  )
  values (
    v_profile_id,
    btrim(p_message),
    nullif(btrim(p_contact_email), '')
  );

  return true;
end;
$$;

revoke all on function public.submit_passport_correction_request(text, text, text)
from public;
grant execute on function public.submit_passport_correction_request(text, text, text)
to anon, authenticated;
