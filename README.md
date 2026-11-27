# Joby AI

**Show what you can do—not just what certificates you have.**

Joby AI helps people turn practical experience into a clear, evidence-led Skills Passport. Candidates can organize skills and work samples, complete structured assessments, and share selected parts of their profile with control over what is visible.

| | |
|---|---|
| **Live project** | [jobyassist.vercel.app](https://jobyassist.vercel.app) |
| **Source code** | [github.com/degraphengineer-ux/joby-ai](https://github.com/degraphengineer-ux/joby-ai) |
| **Hackathon track** | Track 1 — Credential & Skills Validation |

## The problem

People often build valuable skills through projects, self-directed learning, volunteering, and work—but those skills can be hard to communicate when someone lacks formal credentials or has evidence scattered across different places. At the same time, a list of self-reported skills alone does not give a reviewer enough context to assess capability.

Joby AI addresses this gap by bringing skills, supporting evidence, practical assessment results, and shareable profile information together in one candidate-controlled experience.

## The solution

Joby AI gives candidates tools to:

- Record skills, proficiency, and relevant experience.
- Attach evidence such as project links, GitHub links, text samples, and documents.
- Get AI-assisted skill suggestions from provided material, then review and approve each suggestion themselves.
- Complete practical assessments with structured rubrics and server-calculated scores.
- Build a Skills Passport that brings together skills, evidence, credentials, experience, and assessment results.
- Share selected Passport sections through revocable links, with optional expiry and QR codes.
- Compare their skills with available sample career roles and discover learning resources for identified gaps.

The candidate stays in control. AI suggestions are not silently added as verified skills, and assessment feedback is not presented as a qualification.

## How it works

1. **Build a profile:** Add skills, proficiency levels, work history, projects, and volunteer experience.
2. **Add supporting evidence:** Keep evidence private by default and choose whether eligible summaries may be shared.
3. **Explore practical ability:** Complete assessments and review rubric-based feedback.
4. **Create a Passport:** View relevant records together and generate a personal PDF summary.
5. **Share selectively:** Choose which sections and items to include, set an optional expiry, and revoke a link when it is no longer needed.
6. **Plan next steps:** Compare recorded skills with the sample role catalog and explore linked learning resources.

## What makes the project different

- **Evidence alongside skills:** A skill can be presented with context rather than as an unsupported label.
- **Clear trust boundaries:** Self-reported information, AI-assisted suggestions, assessment feedback, and verified records are treated as distinct things.
- **Privacy by design:** Private records are protected with Supabase Row Level Security. Public and token-based Passport views use explicit allowlists and selected sections.
- **Candidate-controlled sharing:** Share links can be scoped, expired, and revoked.
- **Practical assessment:** Fixed rubrics and server-calculated scores provide a consistent structure for feedback.

## Challenges and design decisions

### Trust without overstating verification

A polished profile should not imply that every claim has been independently verified. Joby AI distinguishes self-reported skills and credentials from verified records. AI-generated suggestions require candidate approval, and assessment results are described as advisory rather than official certification.

### Useful AI without exposing private data

AI operations run through authenticated Supabase Edge Functions, not directly from the browser. Evidence access is bounded, user consent is required where applicable, and minimal operational logs avoid storing prompts, documents, or model responses.

### Sharing useful information safely

Public profiles and share links should expose only what the candidate intends to share. Joby AI uses allowlisted public output, item- and section-scoped links, hashed share tokens, optional expiration, and independent revocation.

### Turning a feature list into actionable career guidance

Career comparisons connect a candidate’s skills to role requirements and learning resources. Matching supports normalized skill names and shared taxonomy identifiers, while the interface makes existing skills and gaps visible. The current role catalog is a small sample—not a comprehensive labor-market matching service.

## Current scope and limitations

Joby AI is a working MVP. The following distinctions are important when evaluating or using it:

- Candidate-entered credentials remain **self-reported** until a trusted verification process is available.
- Cryptographic credential-proof validation and automated issuer authentication are not implemented.
- External LMS/provider ingestion and official ESCO/O*NET or regional qualification crosswalks are not implemented.
- Career recommendations use a bundled sample role catalog and learning resources; they are not employer-specific job matches.
- The browser-generated Passport PDF is a summary, not a cryptographically signed or verified credential.
- AI output can be inaccurate. Assessment feedback is advisory and does not replace professional judgment or formal certification.

## Technology

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, Inter
- **Backend and data:** Supabase Auth, PostgreSQL, Row Level Security, private Storage, Edge Functions
- **AI:** Gemini through server-side Supabase functions
- **Validation and testing:** Zod, Vitest, ESLint, TypeScript
- **Hosting:** Vercel

The browser uses a public Supabase key constrained by database policies. Service-role credentials and AI provider secrets remain server-side.

## Run locally

### Requirements

- Node.js 20.16 or newer
- npm
- A Supabase project for authenticated and data-backed features
- A Gemini API key configured as a Supabase Edge Function secret for AI features

### Setup

```powershell
npm ci
Copy-Item .env.example .env.local
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`, then start the app:

```powershell
npm run dev
```

Run the project checks:

```powershell
npm run lint
npm test
npm run build
```

Never put service-role keys, database passwords, or AI provider secrets in browser environment variables or commit them to source control. For database migrations, Edge Function setup, and security details, see [supabase/README.md](./supabase/README.md).

## Hackathon submission

| | |
|---|---|
| **Project** | Joby AI |
| **Track** | Track 1 — Credential & Skills Validation |
| **Live demo** | [https://jobyassist.vercel.app](https://jobyassist.vercel.app) |
| **Repository** | [github.com/degraphengineer-ux/joby-ai](https://github.com/degraphengineer-ux/joby-ai) |

**Short pitch:** Joby AI helps people demonstrate practical skills through reviewed evidence, structured assessments, and a privacy-controlled Skills Passport—making experience easier to communicate without presenting AI output or self-reported claims as official credentials.
