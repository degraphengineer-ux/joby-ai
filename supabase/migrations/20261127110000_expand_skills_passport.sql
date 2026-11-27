create table if not exists public.credential_issuers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  issuer_url text not null,
  issuer_type text not null,
  public_key_jwk jsonb,
  verification_status text not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_issuer_name_length check (char_length(btrim(display_name)) between 1 and 120),
  constraint credential_issuer_url_https check (issuer_url ~ '^https://'),
  constraint credential_issuer_type_allowed check (issuer_type in ('education', 'employer', 'certification_body', 'other')),
  constraint credential_issuer_status_allowed check (verification_status in ('pending', 'verified', 'suspended')),
  constraint credential_issuer_verification_consistent check (
    (verification_status = 'verified' and verified_at is not null and public_key_jwk is not null)
    or (verification_status <> 'verified')
  )
);

create table if not exists public.passport_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  issuer_id uuid references public.credential_issuers(id) on delete set null,
  evidence_id uuid references public.evidence(id) on delete set null,
  title text not null,
  credential_type text not null,
  issuer_name text not null,
  description text,
  credential_identifier text,
  issued_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  status text not null default 'self_reported',
  proof jsonb,
  credential_data jsonb not null default '{}'::jsonb,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint passport_credentials_title_length check (char_length(btrim(title)) between 1 and 160),
  constraint passport_credentials_type_allowed check (
    credential_type in ('degree', 'diploma', 'license', 'certificate', 'micro_credential', 'workshop', 'other')
  ),
  constraint passport_credentials_issuer_length check (char_length(btrim(issuer_name)) between 1 and 160),
  constraint passport_credentials_status_allowed check (
    status in ('self_reported', 'pending_verification', 'verified', 'expired', 'revoked')
  ),
  constraint passport_credentials_visibility_allowed check (visibility in ('private', 'public')),
  constraint passport_credentials_dates_valid check (expires_at is null or issued_at is null or expires_at > issued_at),
  constraint passport_credentials_revocation_consistent check (status <> 'revoked' or revoked_at is not null),
  constraint passport_credentials_verified_proof check (
    status <> 'verified' or (issuer_id is not null and proof is not null and credential_identifier is not null)
  ),
  constraint passport_credentials_data_object check (jsonb_typeof(credential_data) = 'object')
);

alter table public.skills
  add column if not exists skill_type text not null default 'hard_skill',
  add column if not exists taxonomy_framework text,
  add column if not exists taxonomy_code text,
  add column if not exists verified_level text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by_credential_id uuid references public.passport_credentials(id) on delete set null;

alter table public.skills drop constraint if exists skills_level_allowed;
alter table public.skills add constraint skills_level_allowed
  check (self_reported_level in ('beginner', 'intermediate', 'advanced', 'expert', 'unsure'));
alter table public.skills add constraint skills_type_allowed
  check (skill_type in ('hard_skill', 'soft_skill', 'language', 'micro_credential'));
alter table public.skills add constraint skills_verified_level_allowed
  check (verified_level is null or verified_level in ('beginner', 'intermediate', 'advanced', 'expert'));
alter table public.skills add constraint skills_taxonomy_pair
  check ((taxonomy_framework is null) = (taxonomy_code is null));

create table if not exists public.credential_events (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references public.passport_credentials(id) on delete restrict,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint credential_events_type_allowed check (
    event_type in ('created', 'updated', 'verified', 'revoked', 'expired', 'visibility_changed')
  ),
  constraint credential_events_data_object check (jsonb_typeof(event_data) = 'object')
);

create table if not exists public.passport_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  experience_type text not null,
  title text not null,
  organization text,
  description text,
  location text,
  started_at date,
  ended_at date,
  is_current boolean not null default false,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint passport_experience_type_allowed check (experience_type in ('employment', 'project', 'volunteer')),
  constraint passport_experience_title_length check (char_length(btrim(title)) between 1 and 160),
  constraint passport_experience_org_length check (organization is null or char_length(organization) <= 160),
  constraint passport_experience_description_length check (description is null or char_length(description) <= 3000),
  constraint passport_experience_dates_valid check (ended_at is null or started_at is null or ended_at >= started_at),
  constraint passport_experience_current_valid check (not is_current or ended_at is null),
  constraint passport_experience_visibility_allowed check (visibility in ('private', 'public'))
);

create table if not exists public.skill_taxonomy (
  framework text not null,
  code text not null,
  label text not null,
  skill_type text not null default 'hard_skill',
  created_at timestamptz not null default now(),
  primary key (framework, code),
  constraint skill_taxonomy_type_allowed check (
    skill_type in ('hard_skill', 'soft_skill', 'language', 'micro_credential')
  )
);

alter table public.skills add constraint skills_taxonomy_reference
  foreign key (taxonomy_framework, taxonomy_code)
  references public.skill_taxonomy(framework, code);

create table if not exists public.career_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  framework text not null default 'joby',
  region text not null default 'global',
  qualification_level text,
  created_at timestamptz not null default now()
);

create table if not exists public.career_role_skills (
  role_id uuid not null references public.career_roles(id) on delete cascade,
  skill_name text not null,
  taxonomy_framework text,
  taxonomy_code text,
  importance text not null default 'core',
  primary key (role_id, skill_name),
  constraint career_role_skill_importance check (importance in ('core', 'preferred'))
);

alter table public.career_role_skills add constraint career_role_skill_taxonomy_reference
  foreign key (taxonomy_framework, taxonomy_code)
  references public.skill_taxonomy(framework, code);

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  skill_name text not null,
  title text not null,
  provider text not null,
  resource_url text not null,
  resource_type text not null default 'course',
  created_at timestamptz not null default now(),
  constraint learning_resource_unique unique (skill_name, resource_url),
  constraint learning_resource_url_https check (resource_url ~ '^https://'),
  constraint learning_resource_type_allowed check (resource_type in ('course', 'documentation', 'practice'))
);

create table if not exists public.passport_share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'Shared passport',
  sections text[] not null default array['profile','skills']::text[],
  skill_ids uuid[] not null default '{}',
  credential_ids uuid[] not null default '{}',
  experience_ids uuid[] not null default '{}',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint passport_share_label_length check (char_length(btrim(label)) between 1 and 80),
  constraint passport_share_sections_allowed check (
    sections <@ array['profile','skills','credentials','experience','assessments']::text[]
    and cardinality(sections) > 0
  )
);

create index if not exists passport_credentials_owner_idx on public.passport_credentials(user_id, created_at desc);
create index if not exists passport_experiences_owner_idx on public.passport_experiences(user_id, started_at desc);
create index if not exists career_role_skills_name_idx on public.career_role_skills(lower(skill_name));
create index if not exists passport_share_owner_idx on public.passport_share_links(user_id, created_at desc);

create or replace function public.guard_passport_credential_trust_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' and (
    new.status <> 'self_reported'
    or new.issuer_id is not null
    or new.proof is not null
    or new.revoked_at is not null
  ) then
    raise exception 'Only a trusted issuer can create or verify an issued credential.'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and (
    new.status is distinct from old.status
    or new.issuer_id is distinct from old.issuer_id
    or new.proof is distinct from old.proof
    or new.credential_identifier is distinct from old.credential_identifier
    or new.issued_at is distinct from old.issued_at
    or new.expires_at is distinct from old.expires_at
    or new.revoked_at is distinct from old.revoked_at
  ) then
    raise exception 'Credential trust and lifecycle fields can only be changed by a trusted issuer.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists passport_credentials_guard_trust on public.passport_credentials;
create trigger passport_credentials_guard_trust
before insert or update on public.passport_credentials
for each row execute function public.guard_passport_credential_trust_fields();

create or replace function public.record_passport_credential_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  event_name text;
begin
  if tg_op = 'INSERT' then
    event_name := case when new.status = 'verified' then 'verified' else 'created' end;
  elsif new.status is distinct from old.status then
    event_name := case new.status when 'revoked' then 'revoked' when 'expired' then 'expired' when 'verified' then 'verified' else 'updated' end;
  elsif new.visibility is distinct from old.visibility then
    event_name := 'visibility_changed';
  else
    event_name := 'updated';
  end if;

  insert into public.credential_events(credential_id, event_type, actor_user_id, event_data)
  values (
    new.id,
    event_name,
    auth.uid(),
    jsonb_build_object(
      'status', new.status,
      'visibility', new.visibility,
      'issued_at', new.issued_at,
      'expires_at', new.expires_at,
      'issuer_id', new.issuer_id
    )
  );
  return new;
end;
$$;

drop trigger if exists passport_credentials_audit on public.passport_credentials;
create trigger passport_credentials_audit
after insert or update on public.passport_credentials
for each row execute function public.record_passport_credential_event();

create or replace function public.guard_skill_verification_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' and (
    new.verified_level is not null
    or new.verified_at is not null
    or new.verified_by_credential_id is not null
  ) then
    raise exception 'Verified skill levels can only be set by a trusted verifier.'
      using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and (
    new.verified_level is distinct from old.verified_level
    or new.verified_at is distinct from old.verified_at
    or new.verified_by_credential_id is distinct from old.verified_by_credential_id
  ) then
    raise exception 'Verified skill levels can only be set by a trusted verifier.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists skills_guard_verification on public.skills;
create trigger skills_guard_verification
before insert or update on public.skills
for each row execute function public.guard_skill_verification_fields();

do $$
declare table_name text;
begin
  foreach table_name in array array['credential_issuers','passport_credentials','passport_experiences'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

alter table public.credential_issuers enable row level security;
alter table public.passport_credentials enable row level security;
alter table public.credential_events enable row level security;
alter table public.passport_experiences enable row level security;
alter table public.skill_taxonomy enable row level security;
alter table public.career_roles enable row level security;
alter table public.career_role_skills enable row level security;
alter table public.learning_resources enable row level security;
alter table public.passport_share_links enable row level security;

create policy "credential_issuers_verified_or_owner_select" on public.credential_issuers
for select to anon, authenticated using (verification_status = 'verified' or owner_user_id = auth.uid());
create policy "credential_issuers_owner_insert" on public.credential_issuers
for insert to authenticated with check (owner_user_id = auth.uid() and verification_status = 'pending');
create policy "credential_issuers_owner_update" on public.credential_issuers
for update to authenticated using (owner_user_id = auth.uid() and verification_status = 'pending')
with check (owner_user_id = auth.uid() and verification_status = 'pending');

create policy "passport_credentials_owner_manage" on public.passport_credentials
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "credential_events_owner_read" on public.credential_events
for select to authenticated using (
  exists (select 1 from public.passport_credentials c where c.id = credential_id and c.user_id = auth.uid())
);
create policy "passport_experiences_owner_manage" on public.passport_experiences
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "skill_taxonomy_read" on public.skill_taxonomy
for select to anon, authenticated using (true);
create policy "career_roles_read" on public.career_roles
for select to anon, authenticated using (true);
create policy "career_role_skills_read" on public.career_role_skills
for select to anon, authenticated using (true);
create policy "learning_resources_read" on public.learning_resources
for select to anon, authenticated using (true);
create policy "passport_share_links_owner_read" on public.passport_share_links
for select to authenticated using (user_id = auth.uid());
create policy "passport_share_links_owner_revoke" on public.passport_share_links
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.credential_events from public, anon, authenticated;
grant select on public.credential_events to authenticated;
revoke all on public.credential_issuers, public.passport_credentials, public.passport_experiences, public.passport_share_links
from public, anon;
grant select, insert, update, delete on public.credential_issuers to authenticated;
grant select, insert, update on public.passport_credentials to authenticated;
grant select, insert, update, delete on public.passport_experiences to authenticated;
grant select on public.passport_share_links to authenticated;
grant select on public.skill_taxonomy, public.career_roles, public.career_role_skills, public.learning_resources to anon, authenticated;
grant all on public.credential_issuers, public.passport_credentials, public.credential_events,
  public.passport_experiences, public.skill_taxonomy, public.career_roles,
  public.career_role_skills, public.learning_resources, public.passport_share_links to service_role;

insert into public.career_roles(slug, title, framework, region, qualification_level)
values
  ('frontend-developer', 'Frontend Developer', 'joby-sample', 'global', 'Role-based'),
  ('data-analyst', 'Data Analyst', 'joby-sample', 'global', 'Role-based'),
  ('customer-support-specialist', 'Customer Support Specialist', 'joby-sample', 'global', 'Role-based')
on conflict (slug) do nothing;

insert into public.career_role_skills(role_id, skill_name, importance)
select r.id, required.skill_name, required.importance
from (values
  ('frontend-developer','HTML','core'),('frontend-developer','CSS','core'),('frontend-developer','JavaScript','core'),('frontend-developer','Accessibility','preferred'),
  ('data-analyst','Data analysis','core'),('data-analyst','SQL','core'),('data-analyst','Data visualization','preferred'),('data-analyst','Statistics','preferred'),
  ('customer-support-specialist','Communication','core'),('customer-support-specialist','Problem solving','core'),('customer-support-specialist','Customer service','core'),('customer-support-specialist','Writing','preferred')
) as required(role_slug, skill_name, importance)
join public.career_roles r on r.slug = required.role_slug
on conflict (role_id, skill_name) do nothing;

insert into public.skill_taxonomy(framework, code, label, skill_type)
values
  ('joby-sample','WEB-HTML','HTML','hard_skill'),
  ('joby-sample','WEB-CSS','CSS','hard_skill'),
  ('joby-sample','WEB-JS','JavaScript','hard_skill'),
  ('joby-sample','WEB-A11Y','Accessibility','hard_skill'),
  ('joby-sample','DATA-ANALYSIS','Data analysis','hard_skill'),
  ('joby-sample','DATA-SQL','SQL','hard_skill'),
  ('joby-sample','DATA-VISUALIZATION','Data visualization','hard_skill'),
  ('joby-sample','DATA-STATISTICS','Statistics','hard_skill'),
  ('joby-sample','SOFT-COMMUNICATION','Communication','soft_skill'),
  ('joby-sample','SOFT-PROBLEM-SOLVING','Problem solving','soft_skill'),
  ('joby-sample','SOFT-CUSTOMER-SERVICE','Customer service','soft_skill'),
  ('joby-sample','SOFT-WRITING','Writing','soft_skill')
on conflict (framework, code) do nothing;

update public.career_role_skills rs
set taxonomy_framework = t.framework,
    taxonomy_code = t.code
from public.skill_taxonomy t
where lower(t.label) = lower(rs.skill_name)
  and t.framework = 'joby-sample';

insert into public.learning_resources(skill_name, title, provider, resource_url, resource_type)
values
  ('HTML','HTML learning resources','MDN Web Docs','https://developer.mozilla.org/en-US/docs/Learn/HTML','documentation'),
  ('CSS','CSS learning resources','MDN Web Docs','https://developer.mozilla.org/en-US/docs/Learn/CSS','documentation'),
  ('JavaScript','JavaScript learning resources','MDN Web Docs','https://developer.mozilla.org/en-US/docs/Learn/JavaScript','documentation'),
  ('Accessibility','Accessibility fundamentals','W3C WAI','https://www.w3.org/WAI/fundamentals/','documentation'),
  ('SQL','SQL learning resources','SQLBolt','https://sqlbolt.com/','practice'),
  ('Data analysis','Data analysis learning resources','Khan Academy','https://www.khanacademy.org/math/statistics-probability','course'),
  ('Communication','Communication skills practice','OpenLearn','https://www.open.edu/openlearn/','course'),
  ('Problem solving','Problem solving skills','OpenLearn','https://www.open.edu/openlearn/','course'),
  ('Customer service','Customer service skills','OpenLearn','https://www.open.edu/openlearn/','course'),
  ('Writing','Writing practice','Purdue OWL','https://owl.purdue.edu/','documentation')
on conflict do nothing;

create or replace function public.create_passport_share_link(
  p_label text,
  p_sections text[],
  p_skill_ids uuid[] default '{}',
  p_credential_ids uuid[] default '{}',
  p_experience_ids uuid[] default '{}',
  p_expires_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if p_label is null or char_length(btrim(p_label)) not between 1 and 80
    or p_sections is null or cardinality(p_sections) = 0
    or not (p_sections <@ array['profile','skills','credentials','experience','assessments']::text[])
    or (p_expires_at is not null and p_expires_at <= now())
  then raise exception 'Share link settings are invalid.' using errcode = '22023'; end if;
  if exists (select 1 from unnest(coalesce(p_skill_ids,'{}')) i(id) where not exists (
    select 1 from public.skills s where s.id = i.id and s.user_id = auth.uid()
  )) or exists (select 1 from unnest(coalesce(p_credential_ids,'{}')) i(id) where not exists (
    select 1 from public.passport_credentials c where c.id = i.id and c.user_id = auth.uid()
  )) or exists (select 1 from unnest(coalesce(p_experience_ids,'{}')) i(id) where not exists (
    select 1 from public.passport_experiences e where e.id = i.id and e.user_id = auth.uid()
  )) then raise exception 'A selected passport item is unavailable.' using errcode = '42501'; end if;

  insert into public.passport_share_links(user_id, token_hash, label, sections, skill_ids, credential_ids, experience_ids, expires_at)
  values (auth.uid(), encode(extensions.digest(v_token, 'sha256'), 'hex'), btrim(p_label), p_sections,
    coalesce(p_skill_ids,'{}'), coalesce(p_credential_ids,'{}'), coalesce(p_experience_ids,'{}'), p_expires_at);
  return v_token;
end;
$$;

create or replace function public.get_passport_share(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with link as (
    select l.* from public.passport_share_links l
    where l.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
      and l.revoked_at is null and (l.expires_at is null or l.expires_at > now())
      and p_token ~ '^[A-Fa-f0-9]{64}$'
  )
  select jsonb_build_object(
    'display_name', case when 'profile' = any(l.sections) then p.display_name else 'Shared Skills Passport' end,
    'headline', case when 'profile' = any(l.sections) then p.headline else null end,
    'bio', case when 'profile' = any(l.sections) then p.bio else null end,
    'last_updated_at', p.updated_at,
    'skills', case when 'skills' = any(l.sections) then coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', s.name, 'category', s.category, 'proficiency', coalesce(s.verified_level, s.self_reported_level),
        'status_labels', case when s.verified_level is not null then jsonb_build_array('Verified') else jsonb_build_array('Self-reported') end,
        'evidence', '[]'::jsonb
      ) order by s.name) from public.skills s where s.user_id = p.id and s.id = any(l.skill_ids)
    ), '[]'::jsonb) else '[]'::jsonb end,
    'other_evidence', '[]'::jsonb,
    'assessments', case when 'assessments' = any(l.sections) then coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', a.title, 'category', a.category, 'completed_at', x.completed_at,
        'method_label', case x.assessment_method when 'human_review' then 'Human reviewed' else 'AI-assisted assessment' end,
        'score', x.total_score, 'max_score', (x.feedback ->> 'total_max_score')::integer,
        'criteria', (select coalesce(jsonb_agg(jsonb_build_object('criterion', c ->> 'criterion', 'score', (c ->> 'score')::integer, 'max_score', (c ->> 'max_score')::integer)), '[]'::jsonb)
          from jsonb_array_elements(x.feedback -> 'criteria') c)
      ) order by x.completed_at desc)
      from public.assessment_attempts x join public.assessments a on a.id = x.assessment_id
      where x.user_id = p.id and x.status = 'completed' and x.completed_at is not null
        and x.total_score is not null and x.total_score = trunc(x.total_score)
        and jsonb_typeof(x.feedback -> 'criteria') = 'array'
        and x.feedback ->> 'total_max_score' ~ '^[1-9][0-9]?$'
        and x.total_score between 0 and 48
        and not exists (
          select 1 from jsonb_array_elements(x.feedback -> 'criteria') criterion
          where coalesce(criterion ->> 'criterion', '') = ''
            or coalesce(criterion ->> 'score', '') !~ '^(0|[1-4])$'
            or coalesce(criterion ->> 'max_score', '') !~ '^[1-4]$'
        )
    ), '[]'::jsonb) else '[]'::jsonb end,
    'credentials', case when 'credentials' = any(l.sections) then coalesce((
      select jsonb_agg(jsonb_build_object('title', c.title, 'credential_type', c.credential_type,
        'issuer_name', c.issuer_name, 'issued_at', c.issued_at, 'expires_at', c.expires_at,
        'status', c.status, 'credential_identifier', c.credential_identifier)
      order by c.issued_at desc nulls last)
      from public.passport_credentials c where c.user_id = p.id and c.visibility = 'public'
        and c.id = any(l.credential_ids)
    ), '[]'::jsonb) else '[]'::jsonb end,
    'experience', case when 'experience' = any(l.sections) then coalesce((
      select jsonb_agg(jsonb_build_object('experience_type', e.experience_type, 'title', e.title,
        'organization', e.organization, 'description', e.description, 'started_at', e.started_at,
        'ended_at', e.ended_at, 'is_current', e.is_current)
      order by e.started_at desc nulls last)
      from public.passport_experiences e where e.user_id = p.id and e.visibility = 'public'
        and e.id = any(l.experience_ids)
    ), '[]'::jsonb) else '[]'::jsonb end
  )
  from link l join public.profiles p on p.id = l.user_id;
$$;

revoke all on function public.create_passport_share_link(text,text[],uuid[],uuid[],uuid[],timestamptz) from public, anon;
grant execute on function public.create_passport_share_link(text,text[],uuid[],uuid[],uuid[],timestamptz) to authenticated;
create or replace function public.revoke_passport_share_link(p_link_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  update public.passport_share_links
  set revoked_at = now()
  where id = p_link_id and user_id = auth.uid() and revoked_at is null;
  return found;
end;
$$;
revoke all on function public.revoke_passport_share_link(uuid) from public, anon;
grant execute on function public.revoke_passport_share_link(uuid) to authenticated;
revoke all on function public.get_passport_share(text) from public;
grant execute on function public.get_passport_share(text) to anon, authenticated;

create or replace function public.submit_passport_share_correction(
  p_token text,
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
  if p_token is null or p_token !~ '^[A-Fa-f0-9]{64}$'
    or p_message is null or char_length(btrim(p_message)) < 10
    or char_length(p_message) > 2000
    or (p_contact_email is not null and (
      char_length(p_contact_email) > 254
      or p_contact_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )) then
    raise exception 'The correction request is invalid.' using errcode = '22023';
  end if;

  select l.user_id into v_profile_id
  from public.passport_share_links l
  where l.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and l.revoked_at is null and (l.expires_at is null or l.expires_at > now())
  for key share;
  if v_profile_id is null then raise exception 'This passport is not available.' using errcode = 'PT404'; end if;

  perform pg_advisory_xact_lock(hashtextextended('passport-correction:' || v_profile_id::text, 0));
  select count(*)::integer into v_recent_count
  from public.passport_correction_requests r
  where r.profile_id = v_profile_id and r.created_at > now() - interval '10 minutes';
  if v_recent_count >= 5 then raise exception 'Too many requests were submitted for this passport. Try again later.' using errcode = 'PT429'; end if;

  insert into public.passport_correction_requests(profile_id, message, contact_email)
  values (v_profile_id, btrim(p_message), nullif(btrim(p_contact_email), ''));
  return true;
end;
$$;
revoke all on function public.submit_passport_share_correction(text,text,text) from public;
grant execute on function public.submit_passport_share_correction(text,text,text) to anon, authenticated;
