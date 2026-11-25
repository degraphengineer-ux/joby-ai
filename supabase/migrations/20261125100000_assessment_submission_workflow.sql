alter table public.assessments
add column expected_deliverable text;

update public.assessments
set expected_deliverable = case
  when category = 'web_development' then
    'Submit your HTML and CSS, or a clear project description showing the profile card layout. A project URL is optional context; its contents are not fetched or assessed.'
  else instructions
end
where expected_deliverable is null;

alter table public.assessments
alter column expected_deliverable set not null;

alter table public.assessments
add constraint assessments_expected_deliverable_not_blank
check (btrim(expected_deliverable) <> '');

alter table public.assessment_attempts
add column processing_started_at timestamptz;

alter table public.assessment_attempts
add constraint assessment_attempt_submission_text_length
check (submission_text is null or char_length(submission_text) <= 20000);

alter table public.assessment_attempts
add constraint assessment_attempt_submission_url_length
check (submission_url is null or char_length(submission_url) <= 2048);

alter table public.assessment_attempts
add constraint assessment_attempt_submitted_text_required
check (
  status = 'started'
  or (
    submission_text is not null
    and char_length(btrim(submission_text)) >= 20
  )
);

drop policy if exists "assessment_attempts_insert_own"
on public.assessment_attempts;

create policy "assessment_attempts_insert_own"
on public.assessment_attempts for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'started'
  and total_score is null
  and feedback is null
  and completed_at is null
  and assessment_method = 'ai_assisted'
  and exists (
    select 1
    from public.assessments a
    where a.id = assessment_attempts.assessment_id
      and a.is_active = true
  )
);

drop policy if exists "assessment_attempts_update_own_submission"
on public.assessment_attempts;

create policy "assessment_attempts_update_own_submission"
on public.assessment_attempts for update
to authenticated
using (
  user_id = auth.uid()
  and status in ('started', 'submitted', 'failed')
  and total_score is null
  and feedback is null
  and completed_at is null
  and processing_started_at is null
)
with check (
  user_id = auth.uid()
  and status in ('started', 'submitted')
  and total_score is null
  and feedback is null
  and completed_at is null
  and processing_started_at is null
  and assessment_method = 'ai_assisted'
);

create index assessment_attempts_user_created_at_idx
on public.assessment_attempts (user_id, created_at desc);

create table public.assessment_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0)
);

alter table public.assessment_rate_limits enable row level security;

revoke all on table public.assessment_rate_limits
from public, anon, authenticated;

grant select, insert, update, delete on table public.assessment_rate_limits
to service_role;

create or replace function public.consume_assessment_rate_limit(p_user_id uuid)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_window_start timestamptz := to_timestamp(
    floor(extract(epoch from now()) / 3600) * 3600
  );
  v_request_count integer;
begin
  insert into public.assessment_rate_limits as limits (
    user_id,
    window_started_at,
    request_count
  )
  values (p_user_id, v_window_start, 1)
  on conflict (user_id) do update
  set
    window_started_at = excluded.window_started_at,
    request_count = case
      when limits.window_started_at = excluded.window_started_at
        then limits.request_count + 1
      else 1
    end
  where
    limits.window_started_at <> excluded.window_started_at
    or limits.request_count < 5
  returning request_count into v_request_count;

  if not found then
    return query
      select
        false,
        greatest(
          1,
          ceil(extract(epoch from v_window_start + interval '1 hour' - now()))::integer
        );
    return;
  end if;

  return query select true, 0;
end;
$$;

revoke all on function public.consume_assessment_rate_limit(uuid)
from public, anon, authenticated;

grant execute on function public.consume_assessment_rate_limit(uuid)
to service_role;
