# Supabase migrations

Apply the standard migrations to the selected hosted Supabase project:

```powershell
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase migration list --remote
npx supabase db push --remote
```

Confirm the project reference before linking or pushing. `db push` applies pending files from `supabase/migrations/`; it does not apply the optional P1 folder. The CLI may prompt for the database password. Enter it only in the local terminal; never paste it into chat, `.env.local`, Vite code or browser-visible configuration. Never use a service-role key for browser requests.

Use `--remote` explicitly: the CLI otherwise targets the local database by default, which requires a local Postgres server on port `54322`. `npx supabase start` is a separate local-development workflow and requires Docker Desktop to be running.

The standard migration set in `supabase/migrations/` contains the MVP schema, security, seed, private storage, public passport function, profile trigger and hardening. P1 tables are kept in `supabase/optional-migrations/` and are not applied by `supabase db push`.

The optional P1 SQL is a reference migration only. Review and add it to the standard migration path only when the reviewer/logging features are actually scheduled.

## Authentication migration

Apply `20261124000060_create_profile_on_auth.sql` with the core migrations. It creates a `profiles` row inside the auth user creation transaction. Confirm the migration target and trigger in a test project before production deployment.

## Storage

The `evidence` bucket is private. Evidence objects must use this path shape:

```text
<authenticated-user-id>/<evidence-id>/<randomized-safe-file-name>
```

Storage validation is enforced by bucket MIME and size settings plus RLS ownership policies.

Evidence file uploads use an authenticated Edge Function that checks the authenticated user, file size, extension, declared MIME type and file signature before uploading to the private bucket. The function uses the platform's server-only `SUPABASE_SERVICE_ROLE_KEY` to write the validated object; the key must never be exposed to browser code or `VITE_` variables. The migration `20261124000080_lock_down_evidence_storage_writes.sql` prevents authenticated clients from directly inserting or replacing evidence-bucket objects, so the server-side validator cannot be bypassed. Deploy it after linking the intended project:

```powershell
npx supabase functions deploy evidence-upload --remote=<project-ref> --use-api
```

Until both the migration and function are deployed, URL and text evidence work, but private file uploads are unavailable. Evidence links and uploaded files remain private in this phase; there is no public file-sharing flow.

## AI skill extraction

The `extract-skills` Edge Function accepts either user-provided text or the description of an evidence record owned by the authenticated user. It does not fetch submitted URLs, read private files, or store submitted analysis text in the Joby AI database. AI responses are schema-validated and source snippets are checked against the supplied text; suggestions are never saved automatically.

The function uses the server-side `GEMINI_API_KEY` secret and defaults to `gemini-3.5-flash-lite`. `GEMINI_MODEL` is an optional server-side override; changing a Supabase Edge Function secret takes effect without redeploying. Configure the key privately through the Supabase Dashboard's Edge Function secrets or a secure local secret-management workflow (never in a `VITE_` variable, source file, or chat), apply the rate-limit migration, then deploy:

```powershell
npx supabase db push --remote
npx supabase functions deploy extract-skills --remote=<project-ref> --use-api
```

The rate-limit RPC permits five requests per authenticated user per UTC hour. Requests contain at most 12,000 characters, and the function times out Gemini calls after 25 seconds. The frontend lets users edit, accept, or reject each suggestion; accepted skills remain AI suggestions and are not represented as verified. Live extraction requires an authorized deployment and a Gemini key configured privately in Supabase.

## Public passport

`public.get_public_passport(p_slug)` is a SECURITY DEFINER allowlist function. It returns only profile fields approved for the public passport and requires `is_public = true`.

The MVP does not expose private evidence paths or assessment submissions through this function. When public sharing is enabled, the database generates an unguessable slug; disabling and re-enabling sharing rotates it.

## Assessment attempts

Candidates may submit and update submission fields, but cannot create or edit rubric scores, feedback, completion timestamps or the assessment method. Those result fields must be written by a trusted server-side assessment workflow.

## Practical assessment feedback

The `assess-submission` Edge Function accepts an owned `assessment_attempts.id`, reads the saved written submission and trusted assessment rubric, and sends only the written submission and fixed assessment configuration to Gemini. Project URLs are stored for reference but are not fetched or sent to Gemini. Gemini output is schema-validated and must contain exactly one score per trusted rubric criterion; the server computes and stores the total.

The assessment workflow uses the server-side `GEMINI_API_KEY` and optional `GEMINI_MODEL` secrets. Apply its additive migration and deploy the JWT-protected function only after confirming the target project:

```powershell
npx supabase migration list --remote
npx supabase db push --remote
npx supabase functions deploy assess-submission --remote=<project-ref> --use-api
```

The migration adds the expected deliverable, safe attempt-processing state, failed-attempt retry support, and a server-only five-per-hour rate limiter. The function preserves submissions on model or database errors, prevents concurrent duplicate processing, and marks output as AI-assisted rather than certification.

## Live RLS testing

The following requires two existing test accounts and a connected Supabase project:

1. Sign in as test user A.
2. Create profile A, skills, evidence and an assessment attempt.
3. Repeat as test user B.
4. Verify each user cannot select or mutate the other user's rows.
5. Attempt skill-evidence links across ownership boundaries.
6. Attempt to insert or modify an assessment definition as a non-admin.
7. Upload a file under user A's storage prefix and verify user B cannot read or delete it.
8. Confirm direct public access to the private bucket returns no object and that the public passport function remains private unless `is_public` is true.

Do not add or migrate fake authentication records. Live tests should use accounts created explicitly for testing in the selected environment.

## Automated RLS test template

The SQL in `supabase/tests/rls_two_user_test.sql` assumes two existing test accounts. It does not create fake auth users.

Run it through your database test runner with both IDs as named variables:

```text
test_user_a_id=<existing-test-user-a-uuid>
test_user_b_id=<existing-test-user-b-uuid>
```
