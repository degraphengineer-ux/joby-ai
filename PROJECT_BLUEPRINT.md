# SkillProof AI

## Hackathon Product Blueprint & GitHub Copilot Implementation Specification

**Project type:** Focused MVP  
**Hackathon:** Power Learn Project Africa × ILO PROSPECTS Mini Hackathon  
**Track:** Track 1 — Credential & Skills Validation (SDGs 4 and 8)  
**Build window:** 25–26 November 2026  
**Submission:** 27 November 2026  
**Document purpose:** This file is the source of truth for GitHub Copilot and the development team. Read it before creating or modifying project files.

---

# 1. Product Overview

## 1.1 Product name

**Joby AI**

## 1.2 One-line description

An AI-assisted skills validation and digital portfolio platform that helps people demonstrate their practical abilities through evidence and structured assessments, even when formal certificates or academic records are missing.

## 1.3 Product promise

**Show what you can do, not only what documents you have.**

SkillProof AI helps a person turn work samples, projects, experience and practical assessment results into a clear, shareable skills profile. It does not replace official qualification recognition, professional licensing or employer verification.

## 1.4 Hackathon alignment

The PLP Mini Hackathon presentation identifies three systemic roadblocks:

- Unrecognized degrees and missing or unverified foreign records.
- Compliance friction involving work permits and banking.
- Network gaps involving local referrals and experience.

The selected project addresses **Track 1: Credential & Skills Validation**. The presentation describes this track as proving skills without paper records and assessing real-world competencies. Its examples include:

- AI Skill Passport: evaluating code repositories into verified portfolios.
- Credential Mapper: aligning foreign degrees with local standards.
- Bridging Stipend Portal: connecting micro-assessments to exam waivers.

SkillProof AI focuses on the first example: evidence-backed skills profiles and practical competency assessment. Repository analysis is a useful extension, but the MVP must support people who are not software developers too.

The presentation's evaluation benchmarks are:

1. Credential verification: demonstrate competencies even when paper records are missing.
2. Compliance readiness: address work-permit, banking and onboarding bottlenecks.
3. Practical and market fit: align directly with real employer hiring needs.
4. Social and SDG impact: demonstrate measurable progress against SDGs 4, 8, 10, 16 and 17.
5. Scalability: make the solution repeatable across cohorts with low manual overhead.

**Scope note:** SkillProof AI primarily targets benchmark 1, and supports benchmarks 3, 4 and 5 through practical evidence, employer-readable profiles, impact measurement and repeatable assessment workflows. It does not claim to solve work authorization or banking requirements. Those belong to Track 2 and should not be represented as completed features.

---

# 2. Problem Statement

Skilled displaced people and other underserved job seekers may have practical abilities, work experience and completed projects but lack complete, accessible or locally recognized documents to prove those capabilities. Traditional recruitment and credential processes can over-rely on certificates, transcripts and formal employment records. As a result, capable people can be overlooked before their actual skills are assessed.

There is a need for an accessible, low-cost and repeatable way to:

- Collect practical evidence of a person's abilities.
- Help users describe their skills clearly.
- Assess selected competencies through structured tasks.
- Make the evidence and assessment outcomes understandable to employers or training providers.
- Identify skill gaps and suggest useful next steps.

## 2.1 Problem hypothesis

If users can submit practical work evidence and complete transparent, role-relevant assessments, then they can present a more credible picture of their abilities to employers and opportunity providers, even when formal documentation is incomplete.

This is a product hypothesis to validate with users and employers, not a guaranteed employment outcome.

## 2.2 Who experiences the problem?

- Refugees and displaced professionals.
- Refugee and host-community graduates.
- Self-taught workers and career changers.
- Freelancers and people with informal work experience.
- Employers, recruiters and training providers who need clearer evidence of candidate capabilities.

---

# 3. Solution

SkillProof AI provides a guided workflow:

1. **Create a profile:** The user describes their background, target role and skills.
2. **Add evidence:** The user uploads a CV, work sample, project link, code repository or certificate if available.
3. **Extract information:** AI assists with extracting relevant skills and experience from supported documents.
4. **Review and correct:** The user confirms, edits or rejects extracted information.
5. **Assess a skill:** The user selects a skill and completes a structured practical assessment.
6. **Review results:** The system presents a rubric-based result, feedback and evidence links.
7. **Build a Skills Passport:** The platform generates a shareable profile with clear evidence labels.
8. **Plan next steps:** The system suggests learning resources or further assessments for identified gaps.

## 3.1 What makes it different?

- Evidence-first rather than certificate-only.
- Practical assessment rather than AI claims alone.
- Clear provenance labels for every skill.
- Human review and user correction.
- Shareable, employer-readable output.
- Designed for multiple skill areas, not only software engineering.

## 3.2 Trust language

Never label a skill as “officially certified” merely because an AI model assessed it.

Use these evidence statuses:

- **Self-reported:** Entered by the user; not independently assessed.
- **Evidence submitted:** A work sample, link or document has been provided.
- **AI-assisted assessment:** An AI-generated or AI-assisted rubric review has been completed. This is not independent certification.
- **Human reviewed:** A named authorized reviewer has reviewed the evidence and recorded a decision.
- **External credential:** A credential supplied by the user and verified through a documented external verification process. Do not mark this status unless the verification actually occurred.

The UI must explain these distinctions in plain language.

---

# 4. Goals, Non-Goals and MVP Boundaries

## 4.1 MVP goals

The MVP must let a user:

- Register, sign in and sign out.
- Create and edit a skills profile.
- Add skills and experience.
- Submit at least one type of evidence.
- Receive AI-assisted skill extraction from a supported document or text input.
- Review and edit extracted skills before saving.
- Complete at least one structured practical assessment.
- View assessment feedback and rubric results.
- Generate and share a public Skills Passport.
- Control whether their profile is public or private.

The MVP must also provide:

- A responsive user interface.
- A seeded demo account or demo dataset for judging.
- Clear empty, loading, success and error states.
- A working deployed public URL.
- A README with setup and deployment instructions.

## 4.2 Explicit non-goals for the hackathon MVP

Do not attempt to build:

- Official national or international qualification equivalency decisions.
- Official professional licensing or certification.
- Automated refugee status, identity or work-permit verification.
- Banking, wallet, payment or payroll services.
- A full job board or recruitment marketplace.
- A complete learning management system.
- A complex blockchain credential system.
- Fully automated GitHub repository verification across every language.
- A claim that AI can conclusively prove a person's identity or authorship.

These may be future integrations, but they are not required for a credible 48-hour MVP.

## 4.3 Prioritization

**P0 — Must work**

- Authentication.
- Profile creation/editing.
- Skill management.
- Evidence submission.
- AI skill extraction with user review.
- One practical assessment flow.
- Skills Passport generation and public/private access.
- Deployment and demo data.

**P1 — Add if time allows**

- CV PDF text extraction.
- GitHub repository URL and README analysis.
- Additional assessment categories.
- PDF export of the Skills Passport.
- Basic admin/reviewer view.
- Simple impact dashboard.

**P2 — Future**

- Employer accounts and candidate search.
- Human assessor network.
- Credential Mapper integrations.
- Bridging course and stipend referrals.
- Multilingual interface.
- Offline-first/PWA support.
- Integrations with recognized qualification authorities.

---

# 5. Users and User Stories

## 5.1 Primary user: Candidate

A person who wants to demonstrate their skills and build a professional profile.

User stories:

- As a candidate, I want to create a profile so I can describe my experience.
- As a candidate, I want to add skills even if I do not have certificates.
- As a candidate, I want to submit work samples so my abilities have supporting evidence.
- As a candidate, I want AI to help identify skills from my CV or project description.
- As a candidate, I want to review AI suggestions before they appear on my profile.
- As a candidate, I want to complete a practical assessment and understand my result.
- As a candidate, I want to share a Skills Passport without exposing private information.
- As a candidate, I want to remove or update my evidence.

## 5.2 Secondary user: Employer or opportunity provider

User stories:

- As an employer, I want to view a candidate's public Skills Passport.
- As an employer, I want to understand whether a skill is self-reported, supported by evidence or assessed.
- As an employer, I want to open the evidence behind a skill rather than rely on a vague score.

For the MVP, employer access is read-only through a public share link. Full employer accounts and search are future work.

## 5.3 Reviewer (optional P1)

- As an authorized reviewer, I want to inspect submitted evidence and record a review decision.
- As a reviewer, I want to leave feedback and identify what I actually reviewed.
- The system must record reviewer identity and review timestamp.
- Do not create a fake reviewer or automatic “human verified” status.

---

# 6. Core User Journey

```text
Landing page
    |
    v
Sign up / Sign in
    |
    v
Create candidate profile
    |
    v
Add skills and experience
    |
    v
Upload evidence or add project link
    |
    v
AI extracts possible skills
    |
    v
Candidate reviews and edits suggestions
    |
    v
Select a skill to assess
    |
    v
Complete practical assessment
    |
    v
See rubric result and improvement feedback
    |
    v
Skills Passport generated
    |
    v
Choose private or public sharing
```

## 6.1 First-time experience

The first session should guide a user through a short onboarding sequence:

1. Name and preferred display name.
2. Location at a broad level (optional).
3. Professional headline.
4. Skills or areas of interest.
5. Target role or career direction.
6. Evidence upload can be skipped and completed later.

Do not require a refugee status declaration. Do not collect sensitive displacement details unless there is a clearly justified, consented and secure future use case.

---

# 7. Functional Requirements

## 7.1 Authentication and account

- Use Supabase Auth.
- Support email/password authentication.
- Protect authenticated routes.
- Provide sign-out.
- Store the user profile linked to the authenticated user ID.
- Never expose service-role keys in frontend code.

Acceptance criteria:

- A new user can sign up and reach onboarding.
- A returning user can sign in and see their own dashboard.
- A user cannot read or edit another user's private records.

## 7.2 Candidate profile

Profile fields:

- Display name.
- Professional headline.
- Short biography.
- Broad location (optional).
- Target role.
- Years of experience (optional; allow “not sure”).
- Profile visibility: private/public.
- Profile avatar (optional).

Acceptance criteria:

- User can create and edit their profile.
- Required fields are validated.
- Public profile contains only fields explicitly approved for sharing.

## 7.3 Skills management

A skill record should contain:

- Skill name.
- Category.
- Proficiency level selected by the user.
- Description (optional).
- Evidence status.
- Source/evidence references.
- Created and updated timestamps.

Suggested proficiency labels:

- Beginner.
- Intermediate.
- Advanced.
- Not sure.

Do not treat a user's selected proficiency as an assessed result.

## 7.4 Evidence management

Supported MVP evidence:

- Text description of a project or work sample.
- Public project URL.
- GitHub repository URL.
- PDF document upload if secure extraction is implemented.
- Image upload only if it has a clear purpose and is safely handled.

Evidence metadata:

- Title.
- Evidence type.
- Description.
- Storage path or URL.
- Uploaded/created date.
- Owner ID.
- Processing status.
- Consent/visibility setting.

Rules:

- Validate file type and size.
- Store private files in a private Supabase Storage bucket.
- Use short-lived signed URLs for private evidence access.
- Never make all uploaded documents public by default.
- Do not treat a URL as proof that its content is genuine.
- Avoid storing unnecessary identity documents or sensitive personal records.

## 7.5 AI skill extraction

Input:

- User-provided CV text, project description or supported document text.

Output:

- Candidate skills.
- Evidence phrases or source snippets.
- Experience statements.
- Suggested skill categories.
- Confidence indicator.
- Warnings when evidence is insufficient.

The user must review every suggestion before it is saved.

Acceptance criteria:

- AI output follows a validated JSON schema.
- Invalid output is handled gracefully.
- User can accept, edit or reject each suggested skill.
- AI suggestions are never automatically marked externally verified.

## 7.6 Practical assessment

The MVP should support one reliable assessment category first. Recommended initial category: **Web Development Fundamentals**. Keep the data model flexible for other categories.

Assessment format:

- Short scenario or practical task.
- Clear instructions.
- Expected deliverable.
- Assessment rubric.
- Candidate response or submitted project URL.
- AI-assisted feedback.
- Score by rubric dimension.
- Strengths and improvement areas.

Example assessment:
**Task:** Build a responsive profile card using HTML and CSS, or submit a link to a project that demonstrates responsive layout.

Example rubric dimensions:

- Requirement completion.
- Semantic structure.
- Responsive behavior.
- Code clarity.
- Accessibility basics.

Scoring:

- Each rubric dimension is scored from 0 to 4.
- Total score is calculated from rubric dimensions.
- Display the rubric and feedback, not just a single score.
- Explain that the result is an AI-assisted assessment, not an official qualification.

Important:

- Assessment prompts and rubrics should be stored in the database or controlled server-side configuration.
- Do not let the model invent a new rubric after seeing the candidate answer.
- Validate the AI response against the expected schema.
- Keep candidate submissions and AI feedback linked to the assessment attempt.

## 7.7 Skills Passport

The Skills Passport is the central product output.

It should display:

- Candidate display name.
- Professional headline.
- Short bio.
- Skills and user-selected proficiency.
- Evidence linked to each skill.
- Completed assessments and rubric results.
- Evidence status labels.
- Last updated date.
- Public/private sharing state.

Public view:

- Accessible only if the candidate has enabled public sharing.
- Exclude email, private files, internal notes and sensitive fields.
- Provide a clear way to report an issue or request correction.
- Use a non-guessable public slug or token.
- Candidate can revoke sharing.

Acceptance criteria:

- A candidate can preview their passport.
- A candidate can enable/disable public sharing.
- A public link shows only approved information.
- A revoked link no longer exposes the passport.

---

# 8. Application Architecture

## 8.1 Recommended stack

Use a stack that is quick to develop, easy to deploy and understandable to a small hackathon team.

| Layer           | Technology                                | Responsibility                            |
| --------------- | ----------------------------------------- | ----------------------------------------- |
| Frontend        | React + Vite                              | Application UI                            |
| Language        | TypeScript                                | Type safety                               |
| Styling         | Tailwind CSS                              | Responsive design system                  |
| UI primitives   | shadcn/ui or accessible component library | Consistent components                     |
| Icons           | Lucide                                    | Interface icons                           |
| Backend/API     | Supabase + server-side functions          | Data access and secure operations         |
| Database        | PostgreSQL via Supabase                   | Profiles, skills, evidence, assessments   |
| Authentication  | Supabase Auth                             | User sessions                             |
| File storage    | Supabase Storage                          | Private evidence files                    |
| AI              | Gemini API                                | Extraction and assessment feedback        |
| Validation      | Zod                                       | Runtime validation of forms and AI output |
| Hosting         | Vercel                                    | Public application deployment             |
| Version control | GitHub                                    | Source control and README                 |

**Security requirement:** Gemini API calls must be made from a secure server-side endpoint or Supabase Edge Function. Never put the Gemini API key in browser JavaScript or a `VITE_` environment variable.

## 8.2 High-level architecture

```text
Candidate Browser
       |
       v
React + Vite + TypeScript
       |
       +------ Supabase Auth
       |
       +------ Supabase Database
       |          |
       |          +-- Profiles
       |          +-- Skills
       |          +-- Evidence
       |          +-- Assessments
       |          +-- Passport settings
       |
       +------ Supabase Storage
       |          |
       |          +-- Private evidence files
       |
       +------ Secure API / Edge Function
                  |
                  +-- Validate user/session
                  +-- Validate request
                  +-- Retrieve permitted input
                  +-- Call Gemini API
                  +-- Validate AI JSON output
                  +-- Save result
```

## 8.3 Suggested repository structure

Copilot should adapt this structure to the existing repository rather than deleting working files or replacing the project unnecessarily.

```text
skillproof-ai/
├── public/
│   ├── favicon.svg
│   └── images/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── skills/
│   │   ├── evidence/
│   │   └── passport/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── skills/
│   │   ├── evidence/
│   │   ├── extraction/
│   │   ├── assessments/
│   │   └── passport/
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   ├── validation/
│   │   └── utils.ts
│   ├── types/
│   ├── styles/
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── extract-skills/
│       └── assess-submission/
├── tests/
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

If the project uses Next.js or another existing framework, preserve it and map the same feature boundaries into that framework. Do not migrate frameworks just for cosmetic reasons.

---

# 9. Database Schema

Use PostgreSQL with UUID primary keys, foreign keys, timestamps and Row Level Security (RLS).

The following is the logical schema. Implement it with SQL migrations and adjust naming only when necessary.

## 9.1 `profiles`

| Column           | Type        | Notes                                  |
| ---------------- | ----------- | -------------------------------------- |
| id               | uuid        | Primary key; references auth.users.id  |
| display_name     | text        | Required                               |
| headline         | text        | Optional                               |
| bio              | text        | Optional                               |
| location         | text        | Optional broad location                |
| target_role      | text        | Optional                               |
| years_experience | numeric     | Nullable                               |
| avatar_path      | text        | Nullable                               |
| is_public        | boolean     | Default false                          |
| public_slug      | text        | Unique, nullable until sharing enabled |
| created_at       | timestamptz | Default now()                          |
| updated_at       | timestamptz | Default now()                          |

## 9.2 `skills`

| Column              | Type        | Notes                                 |
| ------------------- | ----------- | ------------------------------------- |
| id                  | uuid        | Primary key                           |
| user_id             | uuid        | References profiles.id                |
| name                | text        | Required                              |
| category            | text        | Optional                              |
| self_reported_level | text        | beginner/intermediate/advanced/unsure |
| description         | text        | Optional                              |
| source              | text        | user/ai_suggestion/import             |
| created_at          | timestamptz | Default now()                         |
| updated_at          | timestamptz | Default now()                         |

Do not store a single ambiguous “verified” boolean. Evidence and assessment status should be represented by related records.

## 9.3 `evidence`

| Column            | Type        | Notes                                       |
| ----------------- | ----------- | ------------------------------------------- |
| id                | uuid        | Primary key                                 |
| user_id           | uuid        | References profiles.id                      |
| title             | text        | Required                                    |
| evidence_type     | text        | project_url/github_url/document/text_sample |
| description       | text        | Optional                                    |
| source_url        | text        | Nullable                                    |
| storage_path      | text        | Nullable                                    |
| mime_type         | text        | Nullable                                    |
| processing_status | text        | pending/processed/failed                    |
| visibility        | text        | private/public                              |
| created_at        | timestamptz | Default now()                               |

## 9.4 `skill_evidence`

Join table connecting skills to supporting evidence.

| Column            | Type        | Notes                           |
| ----------------- | ----------- | ------------------------------- |
| skill_id          | uuid        | References skills.id            |
| evidence_id       | uuid        | References evidence.id          |
| relationship_note | text        | Why evidence supports the skill |
| created_at        | timestamptz | Default now()                   |

Use a composite primary key on `(skill_id, evidence_id)`.

## 9.5 `assessments`

| Column       | Type        | Notes                          |
| ------------ | ----------- | ------------------------------ |
| id           | uuid        | Primary key                    |
| title        | text        | Required                       |
| category     | text        | e.g. web_development           |
| description  | text        | Required                       |
| instructions | text        | Required                       |
| rubric       | jsonb       | Fixed rubric definition        |
| difficulty   | text        | beginner/intermediate/advanced |
| is_active    | boolean     | Default true                   |
| created_at   | timestamptz | Default now()                  |

Assessment definitions may be visible to authenticated users. Only trusted administrators should be able to modify them.

## 9.6 `assessment_attempts`

| Column            | Type        | Notes                                         |
| ----------------- | ----------- | --------------------------------------------- |
| id                | uuid        | Primary key                                   |
| assessment_id     | uuid        | References assessments.id                     |
| user_id           | uuid        | References profiles.id                        |
| submission_text   | text        | Nullable                                      |
| submission_url    | text        | Nullable                                      |
| status            | text        | started/submitted/processing/completed/failed |
| total_score       | numeric     | Nullable                                      |
| feedback          | jsonb       | Nullable                                      |
| assessment_method | text        | ai_assisted/human_review                      |
| submitted_at      | timestamptz | Nullable                                      |
| completed_at      | timestamptz | Nullable                                      |
| created_at        | timestamptz | Default now()                                 |

## 9.7 `review_records` (P1)

| Column      | Type        | Notes                                               |
| ----------- | ----------- | --------------------------------------------------- |
| id          | uuid        | Primary key                                         |
| evidence_id | uuid        | References evidence.id                              |
| reviewer_id | uuid        | References profiles.id or trusted reviewer identity |
| decision    | text        | accepted/needs_changes/rejected                     |
| notes       | text        | Optional                                            |
| reviewed_at | timestamptz | Default now()                                       |

Only create human-reviewed status when a real authorized reviewer performs the review.

## 9.8 `ai_processing_logs` (optional P1)

Store minimal operational metadata:

- id
- user_id
- operation_type
- status
- model_name
- error_code
- created_at

Avoid storing full private document contents or sensitive prompts in logs. Do not log API keys, access tokens or unnecessary personal information.

## 9.9 Relationships

```text
auth.users
    |
    +---- profiles
              |
              +---- skills
              |       |
              |       +---- skill_evidence ---- evidence
              |
              +---- evidence
              |
              +---- assessment_attempts ---- assessments
              |
              +---- review_records
```

## 9.10 Row Level Security rules

Enable RLS on all user-owned tables.

- A user can select, insert, update and delete their own profile.
- A user can manage only their own skills.
- A user can manage only their own evidence metadata.
- A user can manage only their own assessment attempts.
- Assessment definitions are readable by authenticated users, but not writable by ordinary users.
- Public passport access must use a carefully scoped server-side query or safe database function that returns only approved fields.
- Never expose private evidence storage paths or raw private documents through a public profile.
- Avoid broad policies such as `USING (true)` on private tables.
- Test RLS with two separate users.

---

# 10. AI Workflow

## 10.1 AI feature A: Skill extraction

**Purpose:** Help a user identify possible skills and experience from information they provide.

Input:

- Plain text from a CV.
- Project description.
- Work sample description.
- Extracted PDF text, if PDF support is implemented.

Workflow:

1. Authenticated user submits text or a supported file.
2. Server validates the session, size and content type.
3. Server extracts text from the file if required.
4. Server sends only necessary content to Gemini.
5. Gemini returns structured JSON.
6. Server validates JSON with Zod.
7. Server returns suggestions to the frontend.
8. User accepts, edits or rejects suggestions.
9. Only user-approved suggestions are stored as skills.

Suggested response schema:

```json
{
  "skills": [
    {
      "name": "Responsive Web Design",
      "category": "Frontend Development",
      "evidence_snippet": "Built a mobile-friendly website using CSS media queries.",
      "reasoning": "The submitted text describes implementation of responsive layouts.",
      "confidence": 0.86
    }
  ],
  "experience_summary": ["Built and maintained responsive web interfaces."],
  "limitations": [
    "The provided text does not independently verify the user's authorship."
  ]
}
```

Rules:

- Confidence is a model estimate, not a probability of truth.
- The model must not invent qualifications, dates, employers or projects.
- If there is insufficient evidence, return an empty list or low-confidence suggestions.
- Preserve source snippets so the user can understand why a suggestion appeared.
- User approval is mandatory before saving.

## 10.2 AI feature B: Practical assessment feedback

Purpose: Provide consistent, rubric-based feedback on a candidate's submitted work.

Workflow:

1. User opens an active assessment.
2. User reads the task and fixed rubric.
3. User submits text, a project URL or a work description.
4. Server checks authentication and ownership.
5. Server loads the trusted assessment definition and rubric.
6. Server sends submission and rubric to Gemini.
7. Gemini returns criterion-level feedback.
8. Server validates scores and response structure.
9. Server calculates the total score using trusted application logic.
10. User sees feedback, strengths and next steps.

Example structured response:

```json
{
  "criteria": [
    {
      "criterion": "Responsive behavior",
      "score": 3,
      "max_score": 4,
      "feedback": "The submission describes a mobile layout, but does not provide enough evidence for tablet behavior."
    },
    {
      "criterion": "Semantic structure",
      "score": 2,
      "max_score": 4,
      "feedback": "The evidence does not show whether semantic HTML elements were used."
    }
  ],
  "strengths": ["Clear explanation of the intended layout."],
  "improvements": [
    "Provide a live preview or screenshots at multiple viewport widths."
  ],
  "overall_summary": "The submission shows developing understanding, with evidence gaps that should be addressed."
}
```

Rules:

- Scores must be integers within the rubric's allowed range.
- The server, not the model, calculates totals.
- The model must identify insufficient evidence instead of guessing.
- Do not assess a URL unless its contents have actually been retrieved through a safe, permitted process.
- A URL alone is not proof of quality or authorship.
- Feedback is advisory and must be labeled AI-assisted.
- Provide an appeal or human review path in a future version.

## 10.3 Prompt design principles

System instruction for extraction:

- You are an assistant helping identify skills from user-provided evidence.
- Use only the supplied content.
- Never invent a skill, credential, employer, date or achievement.
- Return valid JSON matching the requested schema.
- Include source snippets.
- Explain uncertainty.
- Do not decide whether a person is qualified for a regulated profession.

System instruction for assessment:

- Evaluate only against the supplied fixed rubric.
- Do not change rubric criteria or maximum scores.
- Do not infer evidence that is not present.
- Use the full score range fairly.
- Explain each score with evidence.
- Return valid JSON only.
- Clearly identify insufficient evidence.
- Do not issue official certificates or professional licenses.

## 10.4 Error handling and fallback

- If Gemini is unavailable, preserve the user's input and show a retry action.
- If JSON validation fails, retry once with a correction instruction or return a safe error.
- Do not save malformed AI output.
- Add request timeouts and reasonable input limits.
- Rate-limit AI endpoints per user.
- Do not make the user pay or provide sensitive information to access the core demo.
- Show a clear message when an AI result is unavailable.

---

# 11. UI/UX Design Specification

## 11.1 Design direction

Create a modern, calm, trustworthy and accessible professional platform. The product should feel supportive and empowering, not bureaucratic or institutional.

Design principles:

- Clean layouts with generous spacing.
- Clear visual hierarchy.
- Simple language.
- Strong readability.
- Mobile-first responsive behavior.
- Accessible color contrast and keyboard navigation.
- Avoid excessive cards, gradients, shadows and decorative charts.
- Use clear status labels rather than relying on color alone.

Suggested palette:

- Deep navy: `#14213D`
- Teal: `#0F9D9A`
- Warm off-white: `#F7F8FA`
- White: `#FFFFFF`
- Slate text: `#475569`
- Success: `#15803D`
- Warning: `#B45309`
- Error: `#B91C1C`

Use these as starting tokens, not rigid constraints. Ensure WCAG AA contrast where practical.

Typography:

- Use a highly readable sans-serif such as Inter.
- Headings should be confident but not oversized.
- Body text should be comfortable on mobile.
- Use consistent spacing and border radii.

## 11.2 Main navigation

Authenticated desktop navigation:

- Overview
- My Skills
- Evidence
- Assessments
- Skills Passport
- Settings

Mobile:

- Compact header.
- Bottom navigation or accessible menu.
- Keep the primary action easy to find.

## 11.3 Required screens

### A. Landing page (`/`)

Sections:

- Hero: “Show what you can do.”
- Short explanation of evidence-based skills profiles.
- Three-step process: Add evidence → Demonstrate skills → Share your passport.
- Benefits for candidates.
- Trust explanation about evidence labels.
- Call to action: Create your Skills Passport.
- Footer with privacy and product information.

### B. Authentication (`/login`, `/signup`)

- Simple forms.
- Clear validation.
- Password visibility toggle.
- Loading and error states.
- Links between sign-in and sign-up.

### C. Onboarding (`/onboarding`)

- Short multi-step profile setup.
- Progress indicator.
- Skip optional steps.
- Save progress.
- Do not ask for refugee status.

### D. Dashboard (`/dashboard`)

Display:

- Welcome message.
- Profile completion indicator.
- Number of skills.
- Number of evidence items.
- Assessments completed.
- Recent activity.
- Recommended next action.
- Prominent “Add evidence” and “Take assessment” actions.

Avoid vanity metrics. A profile completion score is a guidance indicator, not a measure of a person's worth or employability.

### E. My Skills (`/skills`)

- Skills grouped by category.
- Add/edit/delete skill.
- Self-reported proficiency clearly labeled.
- Evidence status.
- Link supporting evidence.
- Search/filter if time allows.

### F. Evidence (`/evidence`)

- Add project, text sample, GitHub URL or supported document.
- Evidence list with processing status.
- View/edit/delete.
- Visibility control.
- Clear privacy note.

### G. AI extraction (`/evidence/analyze`)

- Input/upload panel.
- Processing state.
- Extracted skill suggestions.
- Source snippet for each suggestion.
- Accept/edit/reject actions.
- Never save all suggestions automatically.

### H. Assessments (`/assessments`)

- Assessment cards.
- Category and difficulty.
- Short description.
- Start assessment action.

### I. Assessment detail (`/assessments/:id`)

- Instructions.
- Expected deliverable.
- Fixed rubric.
- Submission form or URL.
- Submit and confirmation state.

### J. Assessment result (`/assessments/results/:attemptId`)

- Total score and rubric breakdown.
- Strengths.
- Improvement suggestions.
- Evidence limitations.
- AI-assisted assessment label.
- Retry or submit additional evidence action.

### K. Skills Passport (`/passport`)

- Preview of public-facing profile.
- Skills and evidence.
- Assessment history.
- Evidence status labels.
- Share link control.
- Public/private toggle.
- Copy link action.

### L. Public passport (`/p/:slug`)

- Read-only.
- Only approved public fields.
- No private email or files.
- Clear status explanations.
- Responsive and printable.

### M. Settings (`/settings`)

- Profile details.
- Password/account options.
- Privacy and sharing.
- Delete account request or clearly explained deletion process.
- Sign out.

## 11.4 Key UI components

Build reusable components:

- `AppShell`
- `Sidebar`
- `MobileNavigation`
- `PageHeader`
- `StatCard`
- `SkillCard`
- `EvidenceCard`
- `EvidenceStatusBadge`
- `UploadDropzone`
- `ExtractionSuggestion`
- `AssessmentCard`
- `RubricScoreRow`
- `PassportPreview`
- `VisibilityToggle`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `ConfirmDialog`
- `Toast`

## 11.5 UX states

Every data-driven screen should support:

- Initial loading.
- Empty state.
- Success state.
- Error state.
- Form validation.
- Disabled/loading button state.
- Mobile layout.

Never leave a button that looks functional but has no action. If a feature is not implemented, hide it or label it as coming later.

---

# 12. Privacy, Security and Responsible AI

This product serves people who may be in vulnerable circumstances. Privacy is a core product requirement.

- Collect only information needed for the product.
- Do not require users to disclose refugee status.
- Do not request national ID, refugee ID, passport or other sensitive documents for the MVP.
- Use private storage by default.
- Enforce Supabase RLS.
- Keep Gemini API keys on the server.
- Validate all user inputs and AI outputs.
- Limit upload types and file sizes.
- Use signed URLs for private files.
- Do not expose private records through public passport routes.
- Give users control over public sharing.
- Allow users to delete or update their evidence.
- Avoid logging sensitive document content.
- Explain when AI is used and what it does.
- Make clear that AI feedback may be wrong.
- Do not use nationality, ethnicity, gender, religion or displacement status to score skills.
- Do not rank human worth or employability.
- Do not claim a model output is an official credential.
- Use human review for any future high-stakes verification decision.

## 12.1 Public sharing threat model

A public passport must never expose:

- Email address.
- Phone number unless explicitly and separately approved.
- Private evidence files.
- Internal notes.
- Raw CV documents.
- Authentication identifiers.
- Private assessment submissions.

Use an unguessable slug and a server-side allowlist of public fields. Public sharing must be revocable.

---

# 13. Testing and Acceptance Criteria

## 13.1 Core functional tests

1. User can sign up, sign in and sign out.
2. User can create and update their profile.
3. User can add, edit and delete skills.
4. User can add evidence.
5. AI extraction returns valid structured output or a safe error.
6. User can accept, edit and reject suggestions.
7. User can start and submit an assessment.
8. Assessment feedback displays criterion-level results.
9. Total score is calculated by application logic.
10. User can preview and share a passport.
11. User can revoke public access.
12. Public passport does not reveal private fields.
13. User A cannot access User B's private records.
14. App works on mobile and desktop.
15. Deployed application loads without console-breaking errors.

## 13.2 Demo acceptance criteria

A judge should be able to complete this flow without developer intervention:

1. Open the public application.
2. Sign in using a prepared demo account.
3. Open a sample candidate profile.
4. Add or inspect evidence.
5. Run AI skill extraction on sample text.
6. Accept a suggested skill.
7. Complete or inspect a practical assessment.
8. View rubric feedback.
9. Open the Skills Passport.
10. Copy and open the public share link.
11. Confirm that evidence status labels are understandable.

Prepare demo data that is fictional and clearly labeled as demonstration data. Never use a real displaced person's personal documents without informed permission.

## 13.3 Suggested manual test matrix

| Area       | Test                        | Expected result           |
| ---------- | --------------------------- | ------------------------- |
| Auth       | Invalid password            | Clear error               |
| Profile    | Missing display name        | Validation message        |
| Skills     | Add a skill                 | Appears in list           |
| Evidence   | Unsupported file            | Rejected safely           |
| AI         | Empty text                  | Helpful validation        |
| AI         | Invalid model JSON          | Safe error; no bad record |
| Assessment | Score outside rubric        | Rejected                  |
| Passport   | Private profile link        | No public data            |
| Passport   | Revoke link                 | Public access disabled    |
| Security   | User B requests User A data | Access denied             |

---

# 14. Impact Measurement

The hackathon asks for measurable social and SDG impact. Track product outcomes without exaggerating them.

MVP metrics:

- Number of candidate profiles created.
- Number of skills added.
- Number of evidence items submitted.
- Number of AI extraction suggestions accepted, edited or rejected.
- Number of assessments started and completed.
- Number of Skills Passports generated.
- Number of public passports shared.
- Number of candidates who identify a useful next step.

Potential outcome metrics for a later pilot:

- Number of profiles reviewed by employers.
- Number of candidates invited to interviews.
- Number of candidates entering paid work, fellowships or training.
- Time taken to prepare an evidence-backed profile.
- Candidate and employer satisfaction.

Do not claim that creating a passport caused someone to get a job unless a proper evaluation supports that conclusion.

SDG alignment:

- **SDG 4 — Quality Education:** Supports skills assessment and identification of learning gaps.
- **SDG 8 — Decent Work and Economic Growth:** Helps make competencies more visible to opportunity providers.
- **SDG 10 — Reduced Inequalities:** Reduces dependence on formal paper records as the only way to present capabilities.
- **SDG 16 — Peace, Justice and Strong Institutions:** Indirect alignment through transparent, accountable evidence practices; do not claim to provide legal services.
- **SDG 17 — Partnerships for the Goals:** Future collaboration with employers, training providers and qualification bodies.

The primary direct alignment for this project is SDGs 4 and 8, matching Track 1.

---

# 15. 48-Hour Implementation Plan

The presentation schedule is:

- **24 November:** Info session, read concept note and choose track.
- **25 November:** Build Day 1 — prototype the core AI user workflow.
- **26 November:** Build Day 2 — test end-to-end and deploy live.
- **27 November:** Final submission through the official shared link.

The submission checklist requires:

- Live public app URL.
- Track selection (1–3).
- Brief summary.
- Repository link.

## Day 1 — 25 November: Foundation and core workflow

### Phase 1: Project setup

- Inspect existing repository before changing files.
- Confirm framework and package manager.
- Create or confirm Vite/React/TypeScript project.
- Install dependencies.
- Configure Tailwind and UI components.
- Add environment variable example.
- Create Supabase project and connect the app.

**Deliverable:** Application runs locally and connects to Supabase.

### Phase 2: Database and authentication

- Create SQL migrations.
- Create profiles, skills, evidence, assessments and assessment_attempts tables.
- Enable RLS.
- Configure Supabase Auth.
- Build sign-up, sign-in and protected routes.
- Test user ownership.

**Deliverable:** A user can register and reach a protected dashboard.

### Phase 3: Profile, skills and evidence

- Build onboarding.
- Build dashboard shell.
- Build profile editing.
- Build skills CRUD.
- Build evidence CRUD.
- Configure private storage bucket and upload validation.

**Deliverable:** A user can create a profile, add skills and submit evidence.

### Phase 4: AI extraction

- Create secure server-side Gemini endpoint.
- Write extraction prompt.
- Define Zod schema.
- Add loading, error and retry states.
- Build accept/edit/reject UI.
- Save only user-approved suggestions.

**Deliverable:** Complete the first end-to-end AI workflow.

## Day 2 — 26 November: Assessment, passport, polish and deployment

### Phase 5: Assessment engine

- Seed one web development assessment.
- Build assessment listing and detail screens.
- Build submission form.
- Create secure assessment endpoint.
- Validate model output.
- Calculate score on server.
- Save and display results.

**Deliverable:** Candidate completes a practical assessment and receives rubric feedback.

### Phase 6: Skills Passport

- Build passport preview.
- Add evidence and assessment labels.
- Add public/private toggle.
- Generate public slug.
- Build public read-only route.
- Test revocation and data exposure.

**Deliverable:** A candidate can share and revoke a public Skills Passport.

### Phase 7: Testing and UX polish

- Test all core journeys.
- Test RLS with two users.
- Test mobile and desktop.
- Fix broken links and console errors.
- Add loading, empty and error states.
- Add fictional demo data.
- Prepare judge demonstration flow.

**Deliverable:** Stable end-to-end application.

### Phase 8: Deployment

- Push code to GitHub.
- Configure Vercel deployment.
- Add server-side environment variables.
- Configure Supabase redirect URLs and allowed origins.
- Test production authentication and AI requests.
- Verify public passport behavior.
- Write README and submission summary.

**Deliverable:** Live public URL and working repository.

## 27 November: Submission

Before submitting:

- Confirm live app URL.
- Confirm selected track is Track 1.
- Write a concise project summary.
- Confirm GitHub repository is accessible.
- Test the public demo one final time.
- Submit using the official shared link.

## Time management rule

If time becomes tight, protect this sequence:

1. Authentication and user-owned data.
2. Profile, skills and evidence.
3. AI extraction with user approval.
4. One practical assessment.
5. Skills Passport with safe public sharing.
6. Deployment and reliable demo.

Do not sacrifice security or a working end-to-end flow to add extra features.

---

# 16. GitHub Copilot Operating Instructions

**Copilot: Read this entire document before writing code. Treat it as the product requirements document and source of truth.**

## 16.1 First action: inspect, do not overwrite

1. Inspect the repository structure and existing files.
2. Identify the framework, package manager, scripts and installed dependencies.
3. Identify existing working functionality.
4. Report the current architecture and any gaps against this specification.
5. Propose a small implementation plan.
6. Do not delete or replace working code without a clear technical reason.
7. Do not change frameworks unless absolutely necessary.

## 16.2 Implementation rules

- Build a working application, not static mockups.
- Prioritize P0 features.
- Use TypeScript types and Zod validation.
- Keep components reusable and focused.
- Separate UI, data access and server-side AI logic.
- Use Supabase Auth and RLS correctly.
- Never expose secret keys in frontend code.
- Use database migrations for schema changes.
- Add meaningful error handling.
- Keep forms accessible.
- Make the interface responsive.
- Do not add non-functional buttons.
- Do not invent successful API responses.
- Do not use fake verification badges.
- Clearly label demo data.
- Keep dependencies minimal.
- Run the project and tests after meaningful changes.
- Fix errors before moving to the next phase.

## 16.3 AI implementation rules

- Gemini calls must happen server-side.
- Validate request ownership before processing.
- Validate AI output with Zod.
- Use fixed assessment rubrics.
- Calculate scores in application logic.
- Require user approval for extracted skills.
- Preserve uncertainty and evidence limitations.
- Never label AI output as official certification.
- Do not send unnecessary personal data to the model.
- Handle timeouts, rate limits and malformed responses.

## 16.4 Development sequence

Implement in this order:

1. Repository inspection and setup.
2. Supabase configuration and migrations.
3. Authentication and protected routes.
4. Profile and onboarding.
5. Skills CRUD.
6. Evidence CRUD and private storage.
7. AI extraction endpoint and review UI.
8. Assessment data and submission flow.
9. AI assessment feedback and results.
10. Skills Passport preview.
11. Public sharing and revocation.
12. Testing, responsive polish and deployment.
13. README and demo preparation.

At the end of each phase:

- Summarize files created or changed.
- Explain what now works.
- Run relevant checks.
- List blockers.
- Do not claim completion if the feature has not been tested.

## 16.5 Definition of done

The MVP is done only when:

- A user can sign up and sign in.
- A user can create and edit a profile.
- A user can add skills and evidence.
- AI extraction works through a secure endpoint.
- Users can approve or reject extracted skills.
- A user can complete one practical assessment.
- Assessment results show rubric-level feedback.
- A Skills Passport can be generated.
- Public sharing can be enabled and revoked.
- Private data remains private.
- The app is responsive.
- The deployed application works.
- The GitHub README explains setup and usage.

---

# 17. Environment Variables

Create `.env.example` with placeholders only:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server-side only. Never prefix this with VITE_.
GEMINI_API_KEY=

# Add only if required by the chosen server deployment.
SUPABASE_SERVICE_ROLE_KEY=
```

Important:

- `VITE_SUPABASE_ANON_KEY` is intended for browser use with correctly configured RLS.
- `GEMINI_API_KEY` must only be available to server-side code.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must never be exposed to the browser.
- Do not commit `.env` files.
- Confirm actual environment variable names against the selected deployment architecture.

---

# 18. Suggested Demo Script

A 3-minute judge demonstration:

**0:00–0:25 — The problem**
Explain that capable people can lack formal documents to demonstrate their skills.

**0:25–0:50 — Candidate profile**
Open a fictional candidate profile and show skills and experience.

**0:50–1:20 — Evidence and AI extraction**
Submit a sample project description. Run extraction. Show suggested skills and source snippets. Accept one suggestion.

**1:20–2:00 — Practical assessment**
Open the web development assessment. Show the task, rubric and a prepared sample submission. Display criterion-level AI feedback.

**2:00–2:35 — Skills Passport**
Open the passport. Explain the difference between self-reported, evidence-submitted and AI-assessed skills.

**2:35–3:00 — Impact and future**
Explain how this makes competencies more visible and how future partnerships could connect candidates to human reviewers, training providers and employers.

Keep a prepared demo account and sample data available. Do not depend on a slow live upload or an unpredictable AI response during the presentation.

---

# 19. Hackathon Project Summary

**SkillProof AI** is an AI-assisted skills validation and digital portfolio platform built under Track 1: Credential & Skills Validation. It helps displaced and underserved job seekers demonstrate practical competencies through work evidence, structured assessments and a shareable Skills Passport. Users can submit project descriptions, documents or portfolio links, review AI-extracted skill suggestions, complete practical assessments and present transparent evidence labels to opportunity providers. The platform supports skills visibility without treating AI assessments as official certification.

---

# 20. Final Product Principles

1. **Evidence over assumptions.** Every skill should have a clear source or status.
2. **People remain in control.** Users review AI suggestions before saving.
3. **Transparency over inflated claims.** Explain what was assessed and what was not.
4. **Privacy by default.** Public sharing is optional and revocable.
5. **Practical over decorative.** Every major screen supports a real task.
6. **Focused over bloated.** A complete workflow is more valuable than many unfinished features.
7. **Inclusive by design.** The platform must work for people with different educational and professional backgrounds.
8. **Honest impact.** Measure what the product actually does, not outcomes it cannot prove.

**Build the smallest trustworthy product that helps someone demonstrate a real skill.**
