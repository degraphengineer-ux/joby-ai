drop policy if exists "assessment_attempts_manage_own"
on public.assessment_attempts;

create policy "assessment_attempts_select_own"
on public.assessment_attempts for select
to authenticated
using (user_id = auth.uid());

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
);

create policy "assessment_attempts_update_own_submission"
on public.assessment_attempts for update
to authenticated
using (
  user_id = auth.uid()
  and status in ('started', 'submitted')
  and total_score is null
  and feedback is null
  and completed_at is null
)
with check (
  user_id = auth.uid()
  and status in ('started', 'submitted')
  and total_score is null
  and feedback is null
  and completed_at is null
  and assessment_method = 'ai_assisted'
);

create policy "assessment_attempts_delete_own"
on public.assessment_attempts for delete
to authenticated
using (user_id = auth.uid());

revoke all on table public.profiles,
  public.skills,
  public.evidence,
  public.skill_evidence,
  public.assessments,
  public.assessment_attempts
from anon, authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.skills,
  public.evidence,
  public.skill_evidence
to authenticated;

grant select, insert, update, delete on table public.assessments
to authenticated;

grant select, delete on table public.assessment_attempts to authenticated;
grant insert (assessment_id, user_id, submission_text, submission_url)
on public.assessment_attempts to authenticated;
grant update (submission_text, submission_url, status, submitted_at)
on public.assessment_attempts to authenticated;

create or replace function public.ensure_random_public_passport_slug()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_public then
      new.public_slug := replace(gen_random_uuid()::text, '-', '');
    end if;
  elsif new.is_public and (
    not old.is_public
    or new.public_slug is distinct from old.public_slug
  ) then
    new.public_slug := replace(gen_random_uuid()::text, '-', '');
  end if;

  return new;
end;
$$;

revoke all on function public.ensure_random_public_passport_slug() from public;
revoke all on function public.ensure_random_public_passport_slug() from anon, authenticated;

drop trigger if exists profiles_random_public_slug on public.profiles;

create trigger profiles_random_public_slug
before insert or update on public.profiles
for each row execute function public.ensure_random_public_passport_slug();
