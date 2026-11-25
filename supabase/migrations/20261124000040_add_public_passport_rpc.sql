create or replace function public.get_public_passport(p_slug text)
returns table (
  display_name text,
  headline text,
  bio text,
  location text,
  target_role text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.display_name,
    p.headline,
    p.bio,
    p.location,
    p.target_role,
    p.updated_at
  from public.profiles p
  where p.is_public = true
    and p.public_slug = p_slug;
$$;

revoke all on function public.get_public_passport(text) from public;
grant execute on function public.get_public_passport(text) to anon, authenticated;
