-- Run only in a dedicated test project with an existing test auth user.
-- The transaction rolls back every fixture, including the temporary review record.

begin;

create temporary table passport_test_context (
  profile_id uuid,
  slug text,
  skill_id uuid,
  public_evidence_id uuid,
  private_evidence_id uuid,
  assessment_id uuid
);
grant select on passport_test_context to anon;

create temporary table passport_test_user (profile_id uuid not null);
grant select on passport_test_user to anon;
insert into passport_test_user values (:'test_passport_user_id'::uuid);

insert into public.profiles (id, display_name, is_public)
values (:'test_passport_user_id'::uuid, 'Passport Test Candidate', false)
on conflict (id) do update
set display_name = excluded.display_name,
    is_public = false;

update public.profiles
set is_public = true
where id = :'test_passport_user_id'::uuid;

do $$
declare
  v_profile_id uuid;
  v_skill_id uuid;
  v_public_evidence_id uuid;
  v_private_evidence_id uuid;
  v_assessment_id uuid;
  v_slug text;
begin
  select profile_id into strict v_profile_id
  from passport_test_user;

  select public_slug into v_slug
  from public.profiles
  where id = v_profile_id;

  insert into public.skills (user_id, name, category, self_reported_level)
  values (v_profile_id, 'Passport Test Skill', 'Testing', 'intermediate')
  returning id into v_skill_id;

  insert into public.evidence (
    user_id, title, evidence_type, description, visibility
  )
  values (
    v_profile_id,
    'Public evidence fixture',
    'text_sample',
    'This description was explicitly selected for public sharing.',
    'public'
  )
  returning id into v_public_evidence_id;

  insert into public.evidence (
    user_id, title, evidence_type, description, storage_path, visibility
  )
  values (
    v_profile_id,
    'Private evidence secret fixture',
    'document',
    'Private document description secret fixture',
    v_profile_id::text || '/private/path/secret.pdf',
    'private'
  )
  returning id into v_private_evidence_id;

  insert into public.skill_evidence (skill_id, evidence_id)
  values (v_skill_id, v_public_evidence_id), (v_skill_id, v_private_evidence_id);

  insert into public.review_records (evidence_id, reviewer_id, decision, notes)
  values (
    v_public_evidence_id,
    v_profile_id,
    'accepted',
    'Private reviewer note secret fixture'
  );

  insert into public.external_credential_verifications (
    evidence_id,
    credential_name,
    provider,
    verification_method,
    verification_reference,
    verified_by
  )
  values (
    v_public_evidence_id,
    'Test Credential',
    'Test Provider',
    'Checked the issuer verification registry directly.',
    'Private verification reference secret fixture',
    v_profile_id
  );

  insert into public.assessments (
    title,
    category,
    description,
    instructions,
    expected_deliverable,
    rubric,
    difficulty
  )
  values (
    'Passport Test Assessment',
    'testing',
    'A temporary assessment fixture.',
    'Complete this temporary test.',
    'A test submission longer than twenty characters.',
    '{"dimensions":[{"criterion":"Requirement completion","max_score":4,"description":"Test criterion"}]}'::jsonb,
    'beginner'
  )
  returning id into v_assessment_id;

  insert into public.assessment_attempts (
    assessment_id,
    user_id,
    submission_text,
    status,
    total_score,
    feedback,
    completed_at
  )
  values (
    v_assessment_id,
    v_profile_id,
    'Private assessment submission secret fixture.',
    'completed',
    3,
    '{
      "assessment_title":"Passport Test Assessment",
      "assessment_category":"testing",
      "total_max_score":4,
      "method_label":"AI-assisted assessment",
      "criteria":[{"criterion":"Requirement completion","score":3,"max_score":4,"feedback":"Private assessment feedback secret fixture."}],
      "strengths":[],
      "improvements":[],
      "overall_summary":"Private assessment summary secret fixture.",
      "evidence_limitations":[]
    }'::jsonb,
    now()
  );

  insert into passport_test_context
  values (
    v_profile_id,
    v_slug,
    v_skill_id,
    v_public_evidence_id,
    v_private_evidence_id,
    v_assessment_id
  );
end;
$$;

set local role anon;

do $$
declare
  v_slug text;
  v_passport jsonb;
begin
  select slug into v_slug from passport_test_context;
  v_passport := public.get_public_passport_v2(v_slug);

  if v_passport is null then
    raise exception 'An enabled public passport was not returned';
  end if;

  if v_passport ?| array['id', 'user_id', 'email', 'phone', 'public_slug', 'storage_path', 'submission_text', 'feedback'] then
    raise exception 'A forbidden top-level field was returned';
  end if;

  if v_passport::text like '%Private evidence secret fixture%'
    or v_passport::text like '%Private document description secret fixture%'
    or v_passport::text like '%/private/path/secret.pdf%'
    or v_passport::text like '%Private reviewer note secret fixture%'
    or v_passport::text like '%Test Credential%'
    or v_passport::text like '%Test Provider%'
    or v_passport::text like '%Private verification reference secret fixture%'
    or v_passport::text like '%Private assessment submission secret fixture%'
    or v_passport::text like '%Private assessment feedback secret fixture%'
    or v_passport::text like '%Private assessment summary secret fixture%'
  then
    raise exception 'Private evidence, reviewer notes, submission or feedback leaked';
  end if;

  if v_passport::text not like '%Public evidence fixture%'
    or v_passport::text not like '%Human reviewed%'
    or v_passport::text not like '%External credential%'
    or v_passport::text not like '%Passport Test Assessment%'
  then
    raise exception 'Expected public evidence, review status or assessment was missing';
  end if;

  if (v_passport #>> '{assessments,0,criteria,0,score}')::integer <> 3 then
    raise exception 'The public rubric score was not returned';
  end if;

  if public.get_public_passport_v2('bad') is not null then
    raise exception 'An invalid slug returned passport data';
  end if;

  begin
    perform public.get_public_passport(v_slug);
    raise exception 'The legacy public profile RPC is still executable';
  exception
    when insufficient_privilege then null;
  end;

  if public.submit_passport_correction_request(
    v_slug,
    'Please correct this test passport entry.',
    'reporter@example.test'
  ) is not true then
    raise exception 'The correction request was not accepted';
  end if;

  begin
    perform 1 from public.evidence limit 1;
    raise exception 'Anonymous users can directly read evidence';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.passport_correction_requests limit 1;
    raise exception 'Anonymous users can read correction requests';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

update public.profiles
set is_public = false
where id = (select profile_id from passport_test_user);

set local role anon;

do $$
declare
  v_slug text;
begin
  select slug into v_slug from passport_test_context;
  if public.get_public_passport_v2(v_slug) is not null then
    raise exception 'A revoked passport is still publicly readable';
  end if;

  begin
    perform public.submit_passport_correction_request(
      v_slug,
      'This request must fail after the passport is revoked.',
      null
    );
    raise exception 'A correction request was accepted after revocation';
  exception
    when sqlstate 'PT404' then null;
  end;
end;
$$;

rollback;
