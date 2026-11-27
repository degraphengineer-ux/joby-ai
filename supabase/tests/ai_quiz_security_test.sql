do $$
declare
  quiz_table_is_rls_enabled boolean;
begin
  select c.relrowsecurity
  into quiz_table_is_rls_enabled
  from pg_class c
  where c.oid = 'public.ai_quiz_sessions'::regclass;

  if quiz_table_is_rls_enabled is distinct from true then
    raise exception 'AI quiz sessions must have row-level security enabled';
  end if;

  if has_table_privilege('anon', 'public.ai_quiz_sessions', 'SELECT')
    or has_table_privilege('authenticated', 'public.ai_quiz_sessions', 'SELECT')
    or has_table_privilege('authenticated', 'public.ai_quiz_sessions', 'INSERT')
    or has_table_privilege('authenticated', 'public.ai_quiz_sessions', 'UPDATE')
  then
    raise exception 'Client roles must not access private AI quiz sessions or answer keys';
  end if;

  if has_function_privilege('anon', 'public.consume_joby_ai_rate_limit(uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.consume_joby_ai_rate_limit(uuid)', 'EXECUTE')
  then
    raise exception 'Only trusted server functions may consume the Joby AI rate limit';
  end if;

  if not has_table_privilege('service_role', 'public.ai_quiz_sessions', 'SELECT')
    or not has_table_privilege('service_role', 'public.ai_quiz_sessions', 'INSERT')
    or not has_table_privilege('service_role', 'public.ai_quiz_sessions', 'UPDATE')
  then
    raise exception 'The trusted quiz Edge Function requires quiz session table access';
  end if;
end;
$$;
