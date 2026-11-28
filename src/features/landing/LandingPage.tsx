import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
} from '../../components/ui/icons'
import { ButtonLink } from '../../components/ui/Button'
import { EvidenceStatusBadge } from '../../components/ui/EvidenceStatusBadge'
import { PageContainer } from '../../components/layout/PageContainer'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { SiteHeader } from '../../components/layout/SiteHeader'

const workflow = [
  {
    icon: Upload,
    title: 'Record skills and experience',
    text: 'Add proficiency, work history, projects, and volunteer experience in one profile.',
  },
  {
    icon: FileText,
    title: 'Attach the work behind them',
    text: 'Link projects, GitHub repositories, documents, or written samples. Evidence stays private until you decide otherwise.',
  },
  {
    icon: ClipboardCheck,
    title: 'Complete a practical assessment',
    text: 'Work is reviewed against a fixed rubric. Scores and feedback are advisory, and they are not a certification.',
  },
  {
    icon: Globe2,
    title: 'Share a Skills Passport',
    text: 'Publish selected sections, set an optional expiry, and revoke a link when you no longer need it.',
  },
]

const capabilities = [
  {
    icon: FileText,
    title: 'Evidence with context',
    text: 'A skill can sit next to the project or sample that demonstrates it, instead of standing as an unsupported label.',
  },
  {
    icon: Target,
    title: 'Rubric-based assessment',
    text: 'Practical tasks use a fixed rubric and server-calculated scores, so feedback is structured rather than a single opaque number.',
  },
  {
    icon: Sparkles,
    title: 'AI you approve',
    text: 'Skill suggestions from your material stay pending until you accept them. Nothing is added as a verified skill on its own.',
  },
  {
    icon: LockKeyhole,
    title: 'Sharing with a scope',
    text: 'Choose sections and items, set an optional expiry, and revoke access. Uploaded evidence files remain private.',
  },
]

const evidenceStatuses = [
  {
    label: 'Self-reported',
    text: 'Entered by the candidate and not independently assessed.',
  },
  {
    label: 'Evidence submitted',
    text: 'A project, document, or work description is attached.',
  },
  {
    label: 'AI-assisted assessment',
    text: 'Reviewed with AI assistance against a rubric. This is not an official certification.',
  },
  {
    label: 'Human reviewed',
    text: 'An authorized reviewer recorded a review.',
  },
  {
    label: 'External credential',
    text: 'Checked through a documented external verification process.',
  },
] as const

const assurances = [
  'Evidence is private by default.',
  'You approve every AI suggestion.',
  'Assessment results are not credentials.',
]

function ProductScreenshot({
  src,
  alt,
  label,
  className = '',
}: {
  src: string
  alt: string
  label: string
  className?: string
}) {
  return (
    <figure data-gsap-reveal className={`landing-screenshot ${className}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      <figcaption>{label}</figcaption>
    </figure>
  )
}

function ProductScreenshotGallery() {
  return (
    <div className="landing-screenshot-gallery">
      <ProductScreenshot
        src="/images/evidence-preview.png"
        alt="Joby AI evidence form showing private-by-default controls and links to skills"
        label="Evidence with context"
        className="landing-screenshot-gallery__featured"
      />
      <ProductScreenshot
        src="/images/skills-preview.png"
        alt="Joby AI skills page showing a candidate's recorded skills and self-reported proficiency"
        label="Skills"
      />
      <ProductScreenshot
        src="/images/assessment-preview.png"
        alt="Joby AI practical assessments page with rubric-based tasks and skill quizzes"
        label="Practical assessments"
      />
    </div>
  )
}

export function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-warm text-navy">
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero">
          <PageContainer className="relative z-10 grid items-center gap-12 py-14 sm:py-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16 lg:py-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
                Skills Passport
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-navy sm:text-5xl lg:text-[3.25rem]">
                Show practical skills with the work behind them.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slatebody">
                Joby AI brings skills, supporting evidence, structured assessments, and a
                shareable profile into one place the candidate controls.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/signup" size="lg" variant="primary">
                  Create your Skills Passport
                  <ArrowRight size={18} aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="#how-it-works" size="lg" variant="secondary">
                  See how it works
                </ButtonLink>
              </div>
              <ul className="mt-8 space-y-2.5">
                {assurances.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-navy">
                    <Check size={16} className="shrink-0 text-teal-700" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="landing-hero__visual">
              <ProductScreenshot
                src="/images/passport-preview.png"
                alt="Joby AI public Skills Passport showing a profile, skills with supporting evidence, and completed assessments"
                label="A candidate-controlled Skills Passport"
                className="landing-screenshot--passport"
              />
            </div>
          </PageContainer>
        </section>

        <section aria-label="What Joby AI is for" className="border-y border-navy/10 bg-white">
          <PageContainer className="grid gap-8 py-10 sm:py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
                Experience is often real. The record of it is not.
              </h2>
            </div>
            <p className="text-base leading-7 text-slatebody sm:text-lg sm:leading-8">
              Projects, self-directed learning, volunteering, and day-to-day work build skills
              that a certificate list does not capture. A list of self-reported skills, on its
              own, also leaves a reviewer without context. Joby AI keeps the skill, the evidence,
              and the assessment result as separate signals, each labeled for what it is.
            </p>
          </PageContainer>
        </section>

        <section id="how-it-works" className="bg-warm">
          <PageContainer className="py-16 sm:py-20 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] text-navy sm:text-4xl">
                From scattered experience to a passport you can share.
              </h2>
            </div>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-navy/10 bg-navy/10 sm:grid-cols-2">
              {workflow.map(({ icon: Icon, title, text }, index) => (
                <li key={title} data-gsap-reveal className="landing-step">
                  <div className="flex items-center justify-between gap-4">
                    <span className="landing-step__number">0{index + 1}</span>
                    <Icon size={20} className="text-teal-700" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight text-navy">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slatebody">{text}</p>
                </li>
              ))}
            </ol>
          </PageContainer>
        </section>

        <section id="features" className="border-t border-navy/10 bg-white">
          <PageContainer className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:py-24">
            <div className="max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
                Inside the product
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] text-navy sm:text-4xl">
                Skills, evidence, and assessments stay distinct.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slatebody">
                Record what you can do, connect it to work you can point to, and complete
                practical tasks with a visible rubric. The passport is a summary of those
                records, not a claim that every item has been independently verified.
              </p>
              <a
                href="#trust"
                className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-700 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                Read what each status means
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
            <ProductScreenshotGallery />
          </PageContainer>
        </section>

        <section className="bg-warm">
          <PageContainer className="py-16 sm:py-20 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
                What you can do
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] text-navy sm:text-4xl">
                A record a reviewer can interpret.
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {capabilities.map(({ icon: Icon, title, text }) => (
                <article key={title} data-gsap-reveal className="landing-capability">
                  <span className="landing-capability__icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-navy">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slatebody">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </PageContainer>
        </section>

        <section id="trust" className="landing-trust-section">
          <PageContainer className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16 lg:py-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral">
                Trust and transparency
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                Useful signals, labeled for what they are.
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-white/75">
                AI can suggest skills from material you provide and review work against a rubric.
                It does not certify ability. The source of each signal stays visible on the passport.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  'You review every AI-suggested skill before it is saved.',
                  'Evidence status and assessment results are shown separately.',
                  'Public views and share links include only the sections you select.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium leading-6 text-white/90">
                    <Check size={18} className="mt-0.5 shrink-0 text-coral" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div data-gsap-reveal className="landing-status-card">
              <div className="mb-5 flex items-center gap-3 border-b border-navy/10 pb-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-warm text-teal-700">
                  <FileCheck2 size={21} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-navy">What each status means</h3>
                  <p className="mt-0.5 text-sm text-slatebody">The source behind a skill stays visible.</p>
                </div>
              </div>
              <div className="divide-y divide-navy/10">
                {evidenceStatuses.map((status) => (
                  <div key={status.label} className="py-4 first:pt-0 last:pb-0">
                    <EvidenceStatusBadge label={status.label} />
                    <p className="mt-2 text-sm leading-6 text-slatebody">{status.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </PageContainer>
        </section>

        <section id="get-started" className="bg-white">
          <PageContainer className="flex flex-col items-start justify-between gap-8 py-16 sm:py-20 md:flex-row md:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 text-teal-700">
                <ShieldCheck size={22} aria-hidden="true" />
                <span className="text-sm font-semibold uppercase tracking-[0.14em]">Get started</span>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-navy sm:text-4xl">
                Build a Skills Passport from work you already have.
              </h2>
              <p className="mt-3 text-lg leading-8 text-slatebody">
                Organize skills and evidence, complete an assessment, and choose what a reviewer can see.
              </p>
            </div>
            <ButtonLink href="/signup" size="lg" variant="primary" className="shrink-0">
              Create your Skills Passport
              <ArrowRight size={18} aria-hidden="true" />
            </ButtonLink>
          </PageContainer>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
