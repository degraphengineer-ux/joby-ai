import {
  ArrowRight,
  BriefcaseBusiness,
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
    title: 'Bring your work',
    text: 'Add projects, work samples, portfolio links or a description of what you have done.',
  },
  {
    icon: ClipboardCheck,
    title: 'Show what it demonstrates',
    text: 'Connect evidence to skills and explore practical assessments with clear rubrics.',
  },
  {
    icon: Globe2,
    title: 'Share on your terms',
    text: 'Build a Skills Passport that puts your experience in context and stays under your control.',
  },
]

const capabilities = [
  {
    icon: FileText,
    title: 'Evidence with context',
    text: 'Connect each skill to projects, work samples or descriptions—not just a list of claims.',
  },
  {
    icon: Target,
    title: 'Practical assessment',
    text: 'See strengths and next steps through a fixed rubric, not a single opaque score.',
  },
  {
    icon: Sparkles,
    title: 'AI that assists',
    text: 'Review suggestions before they become part of your profile. AI feedback is advisory.',
  },
  {
    icon: LockKeyhole,
    title: 'Sharing you control',
    text: 'Keep evidence private and choose which profile details to share publicly.',
  },
]

const evidenceStatuses = [
  {
    label: 'Self-reported',
    text: 'Entered by the candidate and not independently assessed.',
  },
  {
    label: 'Evidence submitted',
    text: 'A project, document or work description is attached.',
  },
  {
    label: 'AI-assisted assessment',
    text: 'Reviewed with AI assistance against a rubric; not an official certification.',
  },
  {
    label: 'Human reviewed',
    text: 'An authorized reviewer recorded a review.',
  },
  {
    label: 'External credential',
    text: 'Checked through a documented external verification process.',
  },
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
    <figure className={`landing-screenshot ${className}`}>
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
    <div id="top" className="min-h-screen bg-white text-navy">
      <div className="bg-navy text-white">
        <PageContainer className="flex min-h-9 items-center justify-center gap-2 py-2 text-center text-xs font-medium sm:text-sm">
          <ShieldCheck size={15} className="shrink-0 text-coral" aria-hidden="true" />
          <span>Skills deserve to be seen in context.</span>
          <a
            href="#trust"
            className="font-semibold text-coral underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            Learn about our approach
          </a>
        </PageContainer>
      </div>
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero">
          <PageContainer className="relative z-10 flex flex-col items-center pt-14 text-center sm:pt-20 lg:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-stone bg-white/80 px-4 py-2 text-sm font-semibold text-navy shadow-sm">
              <Sparkles size={16} className="text-teal-700" aria-hidden="true" />
              An evidence-first Skills Passport
            </span>
            <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-navy sm:text-6xl lg:text-7xl">
              Your skills deserve
              <br className="hidden sm:block" /> to be seen.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slatebody sm:text-xl">
              Make your practical experience easier to understand. Bring your work together,
              show what it demonstrates, and choose what you share.
            </p>
            <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <ButtonLink href="/signup" size="lg" variant="primary">
                Create your Skills Passport
                <ArrowRight size={18} aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="#how-it-works" size="lg" variant="secondary">
                Explore how it works
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-slatebody">
              Free to get started <span aria-hidden="true">·</span> Private by default
            </p>

            <div className="landing-hero__visual mt-12 w-full sm:mt-16">
              <ProductScreenshot
                src="/images/passport-preview.png"
                alt="Joby AI public Skills Passport showing a profile, skills with supporting evidence, and completed assessments"
                label="A candidate-controlled Skills Passport"
                className="landing-screenshot--passport"
              />
            </div>
          </PageContainer>
          <div className="landing-hero__orb landing-hero__orb--one" aria-hidden="true" />
          <div className="landing-hero__orb landing-hero__orb--two" aria-hidden="true" />
        </section>

        <section aria-label="Joby AI principles" className="border-y border-navy/10 bg-white">
          <PageContainer className="grid gap-5 py-7 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-navy/10 sm:py-8">
            {[
              ['Grounded in evidence', 'Connect skills to real work.'],
              ['Clear about AI', 'You review suggestions.'],
              ['Private by default', 'Share only what you choose.'],
            ].map(([title, text]) => (
              <div key={title} className="flex items-start gap-3 sm:px-7 first:sm:pl-0 last:sm:pr-0">
                <Check size={19} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-navy">{title}</p>
                  <p className="mt-1 text-sm text-slatebody">{text}</p>
                </div>
              </div>
            ))}
          </PageContainer>
        </section>

        <section id="how-it-works" className="bg-white">
          <PageContainer className="py-16 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
                Your experience, made visible
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-navy sm:text-5xl">
                From the work you do to the skills you can show.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slatebody">
                One place to organize practical experience, add helpful context and share a
                clearer picture of your abilities.
              </p>
            </div>

            <div className="mt-12 grid gap-8 border-t border-navy/15 pt-7 md:grid-cols-3 md:gap-8">
              {workflow.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="landing-step">
                  <div className="flex items-center gap-3">
                    <span className="landing-step__number">0{index + 1}</span>
                    <span className="h-px flex-1 bg-navy/10" />
                    <Icon size={22} className="text-teal-700" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-navy sm:text-2xl">{title}</h3>
                  <p className="mt-3 leading-7 text-slatebody">{text}</p>
                </article>
              ))}
            </div>
          </PageContainer>
        </section>

        <section id="features" className="landing-product-section">
          <PageContainer className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
            <div className="max-w-lg">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
                A fuller picture
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-navy sm:text-5xl">
                Focus on your skills. We’ll help put them in context.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slatebody">
                Your experience can come from projects, independent learning, community work
                or a career path that doesn’t fit neatly on a résumé.
              </p>
              <a
                href="#trust"
                className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-700 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                Understand the evidence labels
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
            <ProductScreenshotGallery />
          </PageContainer>
        </section>

        <section className="bg-white">
          <PageContainer className="py-16 sm:py-20 lg:py-24">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
                  Built around your work
                </p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-navy sm:text-5xl">
                  The pieces that make your experience clear.
                </h2>
              </div>
              <p className="max-w-md leading-7 text-slatebody">
                Bring together the details that help someone understand not just what you know,
                but how you have put it into practice.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {capabilities.map(({ icon: Icon, title, text }) => (
                <article key={title} className="landing-capability">
                  <span className="landing-capability__icon">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-navy">{title}</h3>
                    <p className="mt-2 leading-7 text-slatebody">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </PageContainer>
        </section>

        <section id="trust" className="landing-trust-section">
          <PageContainer className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-24">
            <div>
              <span className="landing-trust-section__icon">
                <ShieldCheck size={24} aria-hidden="true" />
              </span>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-coral">
                Trust and transparency
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                Useful signals. Honest about what they mean.
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-white/75">
                AI can help organize possible skills and review work against a rubric. It does
                not certify your abilities, and the source of each signal stays visible.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  'You review every AI-suggested skill.',
                  'Evidence and assessment status remain separate.',
                  'Public passport details are shared only with your choice.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium text-white/90">
                    <Check size={18} className="mt-0.5 shrink-0 text-coral" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="landing-status-card">
              <div className="mb-5 flex items-center gap-3 border-b border-navy/10 pb-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal-700">
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
                    <EvidenceStatusBadge
                      label={status.label as 'Self-reported' | 'Evidence submitted' | 'AI-assisted assessment'}
                    />
                    <p className="mt-2 text-sm leading-6 text-slatebody">{status.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </PageContainer>
        </section>

        <section id="get-started" className="landing-cta-section">
          <PageContainer className="flex flex-col items-start justify-between gap-7 py-14 sm:py-16 md:flex-row md:items-center">
            <div>
              <BriefcaseBusiness className="text-teal-700" size={27} aria-hidden="true" />
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-navy sm:text-5xl">
                Let your work speak for itself.
              </h2>
              <p className="mt-3 max-w-xl text-lg leading-8 text-slatebody">
                Start building a profile that shows the skills behind your experience.
              </p>
            </div>
            <ButtonLink href="/signup" size="lg" variant="primary" className="shrink-0">
              Get started
              <ArrowRight size={18} aria-hidden="true" />
            </ButtonLink>
          </PageContainer>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
