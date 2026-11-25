alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.evidence enable row level security;
alter table public.skill_evidence enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_attempts enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_delete_own"
on public.profiles for delete
to authenticated
using (id = auth.uid());

create policy "skills_manage_own"
on public.skills for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "evidence_manage_own"
on public.evidence for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "skill_evidence_manage_own"
on public.skill_evidence for all
to authenticated
using (
  exists (
    select 1
    from public.skills s
    where s.id = skill_evidence.skill_id
      and s.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.evidence e
    where e.id = skill_evidence.evidence_id
      and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.skills s
    where s.id = skill_evidence.skill_id
      and s.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.evidence e
    where e.id = skill_evidence.evidence_id
      and e.user_id = auth.uid()
  )
);

create policy "assessment_attempts_manage_own"
on public.assessment_attempts for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "assessments_read_active"
on public.assessments for select
to authenticated
using (is_active = true);

create policy "assessments_admin_select"
on public.assessments for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "assessments_admin_insert"
on public.assessments for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "assessments_admin_update"
on public.assessments for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "assessments_admin_delete"
on public.assessments for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
