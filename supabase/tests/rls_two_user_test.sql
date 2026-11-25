-- Run this script only in a dedicated test environment where test_user_a_id and
-- test_user_b_id have already been created as real auth.users test accounts.

begin;

create temporary table two_user_test_context (
  key text primary key,
  value uuid not null
);

insert into two_user_test_context values
  ('user_a', :'test_user_a_id'::uuid),
  ('user_b', :'test_user_b_id'::uuid);

grant select on two_user_test_context to authenticated;

set local role authenticated;

do $$
declare
  user_a uuid;
  user_b uuid;
  skill_a uuid;
  evidence_a uuid;
  skill_b uuid;
begin
  select value into user_a from two_user_test_context where key = 'user_a';
  select value into user_b from two_user_test_context where key = 'user_b';

  perform set_config('request.jwt.claim.sub', user_a::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a::text, 'app_metadata', json_build_object('role', 'candidate'))::text,
    true
  );

  insert into public.profiles (id, display_name)
  values (user_a, 'Test Candidate A')
  on conflict (id) do update
    set display_name = excluded.display_name;

  insert into public.skills (user_id, name)
  values (user_a, 'Responsive Layout')
  returning id into skill_a;

  insert into public.evidence (
    user_id,
    title,
    evidence_type,
    description,
    visibility
  )
  values (
    user_a,
    'Test Project A',
    'text_sample',
    'Dedicated test evidence.',
    'private'
  )
  returning id into evidence_a;

  insert into public.skill_evidence (skill_id, evidence_id)
  values (skill_a, evidence_a);

  perform set_config('request.jwt.claim.sub', user_b::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_b::text, 'app_metadata', json_build_object('role', 'candidate'))::text,
    true
  );

  insert into public.profiles (id, display_name)
  values (user_b, 'Test Candidate B')
  on conflict (id) do update
    set display_name = excluded.display_name;

  insert into public.skills (user_id, name)
  values (user_b, 'Test Skill B')
  returning id into skill_b;

  if exists (
    select 1 from public.profiles
    where id = user_a
  ) then
    raise exception 'User B unexpectedly read User A profile';
  end;

  if exists (
    select 1 from public.skills
    where id = skill_a
  ) then
    raise exception 'User B unexpectedly read User A skill';
  end;

  if exists (
    select 1 from public.evidence
    where id = evidence_a
  ) then
    raise exception 'User B unexpectedly read User A evidence';
  end;

  update public.profiles
  set display_name = 'Unauthorized change'
  where id = user_a;

  if found then
    raise exception 'User B unexpectedly modified User A profile';
  end if;

  begin
    insert into public.skill_evidence (skill_id, evidence_id)
    values (skill_b, evidence_a);
    raise exception 'Cross-user skill/evidence relationship unexpectedly allowed';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.assessments (
      title,
      category,
      description,
      instructions,
      rubric,
      difficulty
    )
    values (
      'Unauthorized test assessment',
      'test',
      'Should not be inserted',
      'Should not be inserted',
      '{}'::jsonb,
      'beginner'
    );
    raise exception 'Ordinary user unexpectedly modified assessment definitions';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  perform set_config('request.jwt.claim.sub', user_a::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a::text, 'app_metadata', json_build_object('role', 'candidate'))::text,
    true
  );

  if not exists (
    select 1 from public.profiles
    where id = user_a
  ) then
    raise exception 'User A could not read their own profile';
  end;

  if not exists (
    select 1 from public.skills
    where id = skill_a
  ) then
    raise exception 'User A could not read their own skill';
  end;

  if not exists (
    select 1 from public.evidence
    where id = evidence_a
  ) then
    raise exception 'User A could not read their own evidence';
  end;
end;
$$;

rollback;
