begin;

do $$
declare
  metrics record;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'evidence'
      and column_name = 'reviewer_consent'
  ) then
    raise exception 'Evidence reviewer consent is not installed.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'review_records'
      and column_name = 'reviewed_material'
  ) then
    raise exception 'Review material tracking is not installed.';
  end if;

  if not exists (
    select 1
    from pg_class
    where oid = 'public.authorized_reviewers'::regclass
      and relrowsecurity
  ) then
    raise exception 'Reviewer authorization must have row-level security enabled.';
  end if;

  if has_table_privilege('authenticated', 'public.authorized_reviewers', 'select')
    or has_table_privilege('authenticated', 'public.review_records', 'insert') then
    raise exception 'Authenticated users must not grant themselves reviewer access or write review records.';
  end if;

  if not has_table_privilege('service_role', 'public.review_records', 'insert') then
    raise exception 'The trusted reviewer function must be able to write review records.';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.record_evidence_review(uuid, uuid, text, text, text[])',
    'execute'
  ) or not has_function_privilege(
    'service_role',
    'public.record_evidence_review(uuid, uuid, text, text, text[])',
    'execute'
  ) then
    raise exception 'Only the trusted reviewer function may record reviewer decisions.';
  end if;

  if not has_table_privilege('authenticated', 'public.ai_processing_logs', 'select')
    or has_table_privilege('authenticated', 'public.ai_processing_logs', 'insert') then
    raise exception 'AI logs must be readable by their RLS policy but not writable by clients.';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ai_processing_logs'
      and column_name in ('prompt', 'source_text', 'response_body', 'api_key', 'access_token')
  ) then
    raise exception 'AI operational logs must not contain source content or credentials.';
  end if;

  if has_function_privilege('anon', 'public.get_impact_metrics()', 'execute')
    or not has_function_privilege('authenticated', 'public.get_impact_metrics()', 'execute') then
    raise exception 'Aggregate impact metrics must be limited to authenticated users.';
  end if;

  if (
    select count(distinct category)
    from public.assessments
    where category in ('data_analysis', 'customer_support')
      and is_active
  ) <> 2 then
    raise exception 'The additional P1 assessment categories are not both active.';
  end if;

  select * into metrics from public.get_impact_metrics();
  if metrics.profiles_created <> (select count(*) from public.profiles)
    or metrics.skills_added <> (select count(*) from public.skills)
    or metrics.ai_suggested_skills_saved <> (
      select count(*) from public.skills where source = 'ai_suggestion'
    )
    or metrics.evidence_submitted <> (select count(*) from public.evidence)
    or metrics.assessments_started <> (select count(*) from public.assessment_attempts)
    or metrics.assessments_completed <> (
      select count(*) from public.assessment_attempts where status = 'completed'
    )
    or metrics.public_passports_shared <> (
      select count(*) from public.profiles where is_public = true
    ) then
    raise exception 'Impact dashboard metrics do not match the underlying aggregate counts.';
  end if;
end;
$$;

rollback;
