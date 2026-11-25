# Joby AI

Joby AI is an evidence-first skills profile and practical assessment platform. Candidates can manage skills and evidence, complete AI-assisted rubric assessments, and choose what to include in a shareable Skills Passport.

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Supabase Auth, Postgres and private Storage
- Zod validation

## Run locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. Configure the Supabase project URL and publishable key in `.env.local`; never expose service-role or Gemini keys in browser variables.

## Quality checks

```powershell
npm run lint
npm run build
```

See [Supabase setup, migrations and security notes](./supabase/README.md) before deploying database or Edge Function changes. Public passports use a server-side allowlist, include only explicitly public evidence summaries, and never include private files or assessment submissions.

## Account and privacy settings

The protected `/settings` page supports password updates, public-passport sharing controls, and sign-out. Account deletion is currently handled manually by the team operating the Supabase project; there is no in-app deletion request or configured support contact in this MVP. Do not send passwords or identity documents when requesting deletion.
