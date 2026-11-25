create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  initial_name text;
begin
  initial_name := btrim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(new.email, 'Candidate'), '@', 1)
  ));

  if initial_name = '' then
    initial_name := 'Candidate';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, initial_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
grant execute on function public.handle_new_auth_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
