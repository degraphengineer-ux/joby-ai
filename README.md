# Joby AI

Joby AI is an evidence-first skills profile and practical assessment platform. It helps candidates show practical abilities through work evidence, structured assessments and a shareable Skills Passport, including when formal records are incomplete.

**Hackathon track:** Track 1 — Credential & Skills Validation.

**Project summary:** Joby AI helps people present practical competencies through evidence-backed skills profiles and rubric-based assessments. AI suggestions remain subject to candidate review; AI-assisted assessment is advisory and is not an official qualification or certification.

## What the MVP includes

- Email/password registration and sign-in with protected candidate routes.
- Candidate profile and self-reported skills management.
- Evidence records for text samples, project URLs, GitHub URLs and supported file uploads.
- Private evidence storage with authenticated upload validation.
- Gemini-powered skill suggestions from user-provided text or an evidence description. Candidates accept, edit or reject each suggestion; submitted URLs and private files are not fetched for extraction.
- A fixed Web Development Fundamentals assessment with server-validated, rubric-based AI feedback. The server calculates the score; a URL alone is not assessed.
- Private Skills Passport preview and revocable public sharing through an allowlisted database function.
- Responsive landing, dashboard, evidence, assessment, passport and settings screens.

## Technology and architecture

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router and Lucide.
- **Backend:** Supabase Auth, PostgreSQL, Row Level Security, private Storage and JWT-protected Edge Functions.
- **AI:** Gemini, called only from Supabase Edge Functions.
- **Validation:** Zod for forms and model output.
- **Hosting target:** Vercel static deployment; connect the repository to a Vercel project as described below.

The browser uses the Supabase publishable/anon key with RLS. Sensitive AI and service-role operations remain in Supabase Functions. Public passport data is returned through a server-side allowlist; private files and submissions are excluded.

## Requirements

- Node.js 20 or newer and npm.
- A Supabase project for authenticated and data-backed features.
- A Gemini API key configured as a Supabase Edge Function secret for AI extraction and assessment.
- Docker Desktop only if running the local Supabase stack.

## Local development

1. Install dependencies:

   ```powershell
   npm ci
   ```

2. Copy the environment template and set the two browser-safe Supabase values:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`. Keep server-only secrets out of `.env.local` and Vercel.

3. Start the frontend:

   ```powershell
   npm run dev
   ```

   Open the URL printed by Vite (normally `http://localhost:5173`).

Quality checks:

```powershell
npm run lint
npm run build
```

There is currently no unit or integration test script in `package.json`. SQL security test templates are in `supabase/tests/` and require disposable test accounts in a dedicated non-production project.

## Environment variables and secrets

| Variable | Where it belongs | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` and Vercel | Supabase project URL used by the browser |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` and Vercel | Browser-safe Supabase publishable/anon key; database access is constrained by RLS |
| `GEMINI_API_KEY` | Supabase Edge Function secrets only | Gemini access for extraction and assessment |
| `GEMINI_MODEL` | Optional Supabase Edge Function secret | Overrides the server-side model default |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server runtime only | Privileged function access; never put it in Vercel or a `VITE_` variable |

Supabase provides the function runtime with its project URL and keys. Configure only missing server secrets through the Supabase Dashboard or an approved secret manager. Never commit production credentials, paste them into chat, or include them in browser bundles. `SUPABASE_DB_PASSWORD`, if required by the CLI, is for local terminal use only.

`.env`, `.env.local` and other `.env.*` files are ignored by Git; `.env.example` contains placeholders only.

## Supabase setup and migrations

The standard schema and security changes are versioned in `supabase/migrations/`. The assessment definition is seeded by a migration; there is no separate SQL seed file. See [supabase/README.md](./supabase/README.md) for migration history, storage policies, AI functions and security details.

For a project you control:

```powershell
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase migration list --remote
```

Confirm the project name and reference before applying any migration. Review pending changes, then apply only when intended:

```powershell
npx supabase db push --remote
```

Set `GEMINI_API_KEY` as a Supabase Function secret. Deploy the functions without disabling JWT verification:

```powershell
npx supabase functions deploy evidence-upload extract-skills assess-submission --remote=<project-ref> --use-api
```

The `--use-api` option avoids a local Docker requirement. Do not use `--no-verify-jwt` or `--prune` for routine deployment.

For local Supabase development, `npx supabase start` requires Docker Desktop. Local Auth URLs in `supabase/config.toml` are configured for Vite on port 5173. Production Auth Site URL and allowed redirect URLs must be set in the Supabase Dashboard to the actual Vercel domain.

## Vercel deployment

1. Push this repository to a Git provider and import it into Vercel.
2. Use the Vite preset, repository root as the project root, `npm run build` as the build command and `dist` as the output directory.
3. Set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel. Add `GEMINI_API_KEY` and other server-only secrets to Supabase Functions, not Vercel.
4. Configure the production application URL, allowed redirects and application origin in Supabase settings.
5. After deployment, test direct navigation and refresh on `/login`, `/dashboard`, `/assessments`, `/passport` and `/p/:slug`, then complete the live smoke tests before sharing the URL.

`vercel.json` provides the SPA fallback needed for client-side deep links.

## Demo preparation

Use a dedicated demo account and clearly label its profile and evidence as fictional demonstration data. Use synthetic work samples only; do not use real displaced people's personal documents without informed permission. Keep demo credentials out of source control and use a staging/demo Supabase project when preparing test data.

No demo account or production URL is currently included in this repository. Do not present a demo as ready until the account and deployed URL have been tested.

## Privacy, security and limitations

- Private evidence is stored in a private bucket. Public passports contain only allowlisted profile information and explicitly public evidence summaries.
- User records are protected with RLS. Edge Functions verify JWTs and ownership, and Gemini secrets remain server-side.
- AI output can be inaccurate. Skill extraction suggestions require candidate approval, and assessment feedback is advisory—not official certification, licensing or human review.
- Assessment feedback is based on submitted text. Project URLs are not fetched, and a URL does not establish authorship or quality.
- File uploads are limited and signature-checked; uploaded documents are not parsed for AI extraction in this MVP.
- There are no employer accounts, candidate search, self-service account deletion, or in-app human review workflow.
- MVP impact event tracking is not implemented. Do not report unmeasured outcomes such as employment gained.
- A deployment URL, GitHub remote, demo account and live end-to-end verification are still required before hackathon submission.

## Hackathon submission

- **Track:** Track 1 — Credential & Skills Validation.
- **Summary:** Joby AI helps candidates demonstrate practical skills through user-reviewed evidence, fixed-rubric assessments and a privacy-controlled Skills Passport. AI assistance is transparent and is not presented as official certification.

Add the tested production URL and repository URL to the official submission form after deployment. Do not submit a URL until it has been opened and smoke-tested.
