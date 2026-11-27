# Joby AI

Joby AI is an evidence-first skills profile and practical assessment platform. It helps candidates show practical abilities through work evidence, structured assessments and a shareable Skills Passport, including when formal records are incomplete.

**Hackathon track:** Track 1 — Credential & Skills Validation.

**Project summary:** Joby AI helps people present practical competencies through evidence-backed skills profiles and rubric-based assessments. AI suggestions remain subject to candidate review; AI-assisted assessment is advisory and is not an official qualification or certification.

## What the MVP includes

- Email/password registration and sign-in with protected candidate routes.
- Candidate profile and skills management with explicit skill types, self-reported proficiency, verified-level separation and optional taxonomy identifiers.
- Evidence records for text samples, project URLs, GitHub URLs and supported file uploads.
- Private evidence storage with authenticated upload validation.
- Gemini-powered skill suggestions from user-provided text, evidence descriptions, bounded text extracted from private PDFs, or a public GitHub root README. Candidates accept, edit or reject each suggestion; PDFs remain private, arbitrary URLs are not fetched, and repository code is never fetched or executed.
- Web Development Fundamentals, Data Analysis, and Customer Support assessments with fixed, server-validated rubrics. The server calculates scores; URLs alone are not assessed.
- Private Skills Passport preview with a credential wallet, structured work/project/volunteer history, and completed assessments.
- Existing public passport links plus separate section- and item-scoped share links with optional expiry, independent revocation and QR codes.
- Browser-generated PDF export of the private Skills Passport.
- Sample role-to-skill gap comparisons and linked learning resources; these are indicative matches, not employer job matches or qualification equivalencies.
- Reviewer queue gated by explicit candidate consent and an administrator-managed reviewer allowlist. Decisions identify the reviewer, reviewed materials, notes and timestamp.
- Aggregated product-activity dashboard with real record counts and no personal identifiers or employment-outcome claims.
- Minimal AI operational logs containing status and model metadata only, never prompts, documents or model responses.
- Responsive landing, dashboard, evidence, assessment, passport, reviewer and impact screens.

## Technology and architecture

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Inter and Remix Icon.
- **Backend:** Supabase Auth, PostgreSQL, Row Level Security, private Storage and JWT-protected Edge Functions.
- **AI:** Gemini, called only from Supabase Edge Functions.
- **Validation:** Zod for forms and model output.
- **Hosting target:** Vercel static deployment; connect the repository to a Vercel project as described below.

The browser uses the Supabase publishable/anon key with RLS. Sensitive AI and service-role operations remain in Supabase Functions. Public passport data is returned through a server-side allowlist; private files and submissions are excluded.

## Design system

The shared tokens in `src/styles/globals.css` and `tailwind.config.ts` use Paper (`#F6F4F1`), Stone (`#E4DED2`), Coral (`#F95C4B`) and black, with semantic status colors for feedback. Inter is the application typeface and Remix Icon is used for interface icons. Shared controls and page headings apply across the public site, authentication, and authenticated workspace; the workspace uses a responsive sidebar that becomes a mobile navigation drawer.

## Requirements

- Node.js 20.16 or newer and npm.
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
npm test
npm run build
```

Focused feature tests run with `npm test`. SQL integration checks are in `supabase/tests/`; run them only against a dedicated test database after applying migrations. Live reviewer and RLS checks require real, explicitly authorized test accounts.

## Environment variables and secrets

| Variable | Where it belongs | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` and Vercel | Supabase project URL used by the browser |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` and Vercel | Browser-safe Supabase publishable/anon key; database access is constrained by RLS |
| `GEMINI_API_KEY` | Supabase Edge Function secrets only | Gemini access for Joby AI, extraction and assessment |
| `GEMINI_MODEL` | Optional Supabase Edge Function secret | Overrides the server-side model default |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server runtime only | Privileged function access; never put it in Vercel or a `VITE_` variable |

Supabase provides the function runtime with its project URL and keys. Configure only missing server secrets through the Supabase Dashboard or an approved secret manager. Never commit production credentials, paste them into chat, or include them in browser bundles. `SUPABASE_DB_PASSWORD`, if required by the CLI, is for local terminal use only.

`.env`, `.env.local` and other `.env.*` files are ignored by Git; `.env.example` contains placeholders only.

## Supabase setup and migrations

The standard schema and security changes are versioned in `supabase/migrations/`. The assessment definition is seeded by a migration; there is no separate SQL seed file. See [supabase/README.md](./supabase/README.md) for migration history, storage policies, AI functions and security details.

The additive `20261127110000_expand_skills_passport.sql` migration adds private credential and experience records, credential event history, a taxonomy registry, sample career-role requirements and learning resources, and hashed bearer-token share links. User-entered credentials remain self-reported; only trusted server-side operations can mark an issuer or credential verified. Issuer verification workflows, cryptographic credential-proof validation, provider/LMS ingestion, and official qualification-framework crosswalks are not yet configured. The PDF export is not a cryptographically verified credential.

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
npx supabase functions deploy evidence-upload extract-skills assess-submission joby-ai ai-quiz review-evidence --remote=<project-ref> --use-api
```

The `--use-api` option avoids a local Docker requirement. Do not use `--no-verify-jwt` or `--prune` for routine deployment.

The Joby AI page uses the authenticated `joby-ai` Edge Function, keeps recent context in page memory, and does not persist chat transcripts. Profile context, skill-based quizzes, assessment skill context, and public page analysis are optional account permissions managed under Settings → Privacy and permissions; each defaults to off and is enforced by the Edge Functions. Profile and skill data are loaded server-side only for the authenticated user. Public page analysis accepts public HTTPS URLs and uses Gemini's URL context tool; pages requiring sign-in, unsupported pages, and private/local addresses are not supported. Retrieved page content is treated as untrusted input. Personalized skill quizzes use `ai-quiz`; the function stores answer keys privately, grades on the server, and shows correct answers and explanations after submission. Quiz history and results are returned only to the authenticated owner. Assessment skill permission is recorded with each private attempt and also checked against the current account permission during evaluation. Apply the AI and quiz migrations before deploying the functions. All AI features use server-side Gemini access, never a browser key.

The Phase 11 migration adds reviewer consent, server-only reviewer authorization, aggregate impact metrics, review-material audit fields, minimal AI logs and the two additional assessment categories. Apply the migration before deploying the updated `extract-skills`, `assess-submission` and `review-evidence` functions. To authorize a reviewer, an administrator must insert that existing Auth user’s UUID into `public.authorized_reviewers` using the Supabase SQL editor or another trusted administrative channel. The reviewer dashboard is not accessible based on sign-in alone.

PDF extraction is limited to 10 MB and 25 pages, returns at most 12,000 characters, does not OCR scanned images, and does not save extracted text to the evidence record or operational logs. GitHub analysis retrieves only public repository metadata and the root README through `api.github.com`; it never fetches or executes submitted code and does not verify authorship. PDF text and GitHub README text are sent to Gemini only after the user confirms consent in the UI.

The Passport PDF is generated in the browser from the private preview. It includes profile/evidence descriptions and assessment summaries, but never includes uploaded file contents, storage paths, account identifiers or reviewer notes. Treat the downloaded PDF as private.

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
- Assessment feedback is based on submitted text. Project URLs are not fetched, and a URL does not establish authorship or quality. GitHub analysis is limited to a public README and metadata.
- File uploads are limited and signature-checked. PDF text extraction is bounded, non-OCR, and runs on the server; files remain in private storage.
- Reviewer access is opt-in per evidence item and must be granted by an administrator. A reviewer’s decision is an accountable human review, not independent verification of authorship.
- Impact numbers are current product-record aggregates only. The app does not measure employment, interviews, or other downstream outcomes.
- There are no employer accounts, candidate search or self-service account deletion.
- A deployment URL, GitHub remote, demo account and live end-to-end verification are still required before hackathon submission.

## Hackathon submission

- **Track:** Track 1 — Credential & Skills Validation.
- **Summary:** Joby AI helps candidates demonstrate practical skills through user-reviewed evidence, fixed-rubric assessments and a privacy-controlled Skills Passport. AI assistance is transparent and is not presented as official certification.

Add the tested production URL and repository URL to the official submission form after deployment. Do not submit a URL until it has been opened and smoke-tested.
