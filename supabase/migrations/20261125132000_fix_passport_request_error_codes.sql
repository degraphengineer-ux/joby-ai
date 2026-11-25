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
