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

The standard migration set in `supabase/migrations/` contains the MVP schema, security, seed, private storage, passport sharing, profile trigger, hardening and the scheduled Phase 11 P1 integrations. `review_records` is created by the Skills Passport migration; the Phase 11 migration adds reviewer consent/authorization, audit material, the AI operational log table, aggregate impact RPC and assessment definitions.

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

Until both the storage migration and upload function are deployed, URL and text evidence work, but private file uploads are unavailable. Files remain in the private bucket. Reviewer access is separate, opt-in and limited to short-lived signed links; there is no public file-sharing flow.

## AI skill extraction

The `extract-skills` Edge Function accepts user-provided text, an owned evidence description, an owned private PDF, or an owned GitHub evidence record. PDF extraction checks the private storage path, MIME type, size and PDF signature, limits parsing to 25 pages and 12,000 extracted characters, disables evaluation support and font rendering, and does not save extracted content. Scanned PDFs are not OCR’d. GitHub analysis validates a public repository root and fetches only the GitHub API repository metadata and root README; it does not fetch or execute code. Unavailable or insufficient sources are reported without generated suggestions. The UI requires explicit consent before PDF or GitHub source text is sent to Gemini. AI responses are schema-validated and source snippets are checked against the supplied text; suggestions are never saved automatically.

The function uses the server-side `GEMINI_API_KEY` secret and defaults to `gemini-3.5-flash-lite`. `GEMINI_MODEL` is an optional server-side override; changing a Supabase Edge Function secret takes effect without redeploying. Configure the key privately through the Supabase Dashboard's Edge Function secrets or a secure local secret-management workflow (never in a `VITE_` variable, source file, or chat), apply the rate-limit migration, then deploy:

```powershell
npx supabase db push --remote
npx supabase functions deploy extract-skills --remote=<project-ref> --use-api
```

The rate-limit RPC permits five requests per authenticated user per UTC hour. Requests contain at most 12,000 characters, and the function times out Gemini calls after 25 seconds. The frontend lets users review source text, edit, accept, or reject each suggestion; accepted skills remain AI suggestions and are not represented as verified. Minimal operational logs record the user, operation, status, model and a bounded error code only. Prompts, source text, AI output, tokens and credentials are not logged.

## Reviewer access

The `/reviewer` screen calls the JWT-protected `review-evidence` Edge Function. Each evidence item is excluded unless its owner enabled reviewer consent. Reviewer authorization is stored in `public.authorized_reviewers`, which has RLS enabled and no client grants. Only an administrator using a trusted database channel should grant access:

```sql
insert into public.authorized_reviewers (user_id)
values ('<existing-auth-user-uuid>')
on conflict (user_id) do update set is_active = true;
```

Revoke access by setting `is_active = false`. Never let a user grant their own reviewer access. The function checks the authenticated user against this allowlist, signs consented private files for 60 seconds, and records the authenticated reviewer UUID, evidence ID, explicit decision, selected reviewed materials, optional notes and timestamp. The review insert re-checks authorization and evidence consent transactionally. A reviewer cannot write review records directly as an ordinary authenticated user; duplicate reviews by the same reviewer are rejected.

Deploy `review-evidence` with JWT verification enabled after applying the Phase 11 migration. Candidates can withdraw consent by editing the evidence item; earlier review records remain for accountability, and an already issued private-file link can remain usable for up to 60 seconds.

## Impact dashboard and assessment categories

`/impact` calls `get_impact_metrics()`, which returns only aggregate counts for current profile, skill, evidence, attempt and public-sharing rows. No user identifiers are returned. “AI-suggested skills saved” counts skills with `source = 'ai_suggestion'`; this does not count rejected or edited suggestions. Job placements, interviews and other downstream outcomes are not measured.

Phase 11 seeds fixed-rubric `data_analysis` and `customer_support` categories. They use the existing server-validated scoring workflow; scores are advisory and not qualifications.

The private `/passport` page can export the current preview to PDF in the browser. The generated document includes private profile/evidence summaries and assessment feedback shown on that preview, but omits storage paths, uploaded file contents, reviewer notes and account identifiers. The candidate must treat the exported PDF as private.

Run `supabase/tests/phase_11_integrations_test.sql` in a dedicated test project after applying all migrations. It checks category seeds, aggregate correctness, reviewer privileges, RLS and the non-content AI log schema. Frontend and parsing tests run with `npm test`; never run SQL integration checks against production data.

## Skills Passport and public sharing

The private preview is available at `/passport`; public links use `/p/:slug`. The profile trigger generates a random UUID-based slug when sharing is enabled and rotates it when sharing is re-enabled. Revoking sharing sets `is_public = false`, which makes subsequent public queries return no passport.

The Phase 07 migration adds `get_public_passport_v2(p_slug)`, a `SECURITY DEFINER` function with an explicit JSON allowlist. It returns profile display fields, skills and self-reported proficiency, only evidence explicitly set to public, completed rubric scores, and the last-updated date. It does not return account identifiers, email, phone, private evidence, Storage paths, reviewer notes, assessment submissions, or detailed assessment feedback. Uploaded documents remain private even when their evidence summary is shared. The older profile-only RPC is revoked.

The migration creates `review_records` when absent but does not create review rows or grant candidates write access. “Human reviewed” is shown only when a real trusted review record exists. AI-assisted scores remain distinct from human review and official credentials; no external credential is marked verified automatically.

Public correction requests are validated and saved in `passport_correction_requests`; the table is not readable by anonymous or ordinary authenticated users. Requests are stored for later administrative review, but this MVP does not send notifications or include an admin review screen.

Run `supabase/tests/public_passport_test.sql` only in a dedicated test project with an existing test auth user. It checks the public field allowlist, private evidence and submission exclusions, invalid and revoked slugs, public review/assessment status, and correction-request access.

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
