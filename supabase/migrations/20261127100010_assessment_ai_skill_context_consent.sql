alter table public.assessment_attempts
add column ai_skill_context_consent boolean not null default false;
