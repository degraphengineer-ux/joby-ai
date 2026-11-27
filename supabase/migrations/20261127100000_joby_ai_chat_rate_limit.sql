create table public.joby_ai_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0)
);

alter table public.joby_ai_rate_limits enable row level security;

revoke all on table public.joby_ai_rate_limits
from public, anon, authenticated;

grant select, insert, update, delete on table public.joby_ai_rate_limits
to service_role;

create or replace function public.consume_joby_ai_rate_limit(p_user_id uuid)
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
  insert into public.joby_ai_rate_limits as limits (
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
    or limits.request_count < 20
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

revoke all on function public.consume_joby_ai_rate_limit(uuid)
from public, anon, authenticated;

grant execute on function public.consume_joby_ai_rate_limit(uuid)
to service_role;
