import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Globe2,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  UserRound,
} from 'lucide-react'
import { ButtonLink } from '../../components/ui/Button'
import { EvidenceStatusBadge } from '../../components/ui/EvidenceStatusBadge'
import { PageContainer } from '../../components/layout/PageContainer'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { SiteHeader } from '../../components/layout/SiteHeader'

const workflow = [
  {
    icon: Upload,
    step: '01',
    title: 'Bring your evidence',
    text: 'Add a project, work sample, portfolio link or a description of what you have done.',
  },
  {
    icon: ClipboardCheck,
    step: '02',
    title: 'Demonstrate the skill',
    text: 'Review AI-suggested skills and complete a practical task with a clear rubric.',
  },
  {
    icon: Globe2,
    step: '03',
    title: 'Share your passport',
    text: 'Present the evidence and context behind each skill in a profile you control.',
  },
]

const features = [
  {
    icon: FileText,
    title: 'Evidence, not empty claims',
    text: 'Connect each skill to real work, project links or submitted descriptions.',
  },
  {
    icon: Target,
    title: 'Practical assessment',
    text: 'Understand strengths and gaps through a fixed rubric, not a single opaque score.',
  },
  {
    icon: Layers3,
    title: 'More than one career path',
    text: 'Start with what you can demonstrate, whether it comes from web development, creative work or operations.',
  },
  {
    icon: LockKeyhole,
    title: 'Sharing stays in your hands',
    text: 'Private evidence remains separate from optional public profile sharing.',
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
    text: 'A rubric review was completed with AI assistance, not official certification.',
  },
  {
    label: 'Human reviewed',
    text: 'A real authorized reviewer recorded a review. This label appears only when such a review exists.',
  },
  {
    label: 'External credential',
    text: 'A credential was checked through a documented external verification process.',
  },
]

export function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-warm text-navy">
      <div className="bg-teal/10 text-navy">
        <PageContainer className="flex flex-col items-center justify-between gap-1 py-2 text-center text-xs font-semibold sm:flex-row sm:text-left sm:text-sm">
          <span>Skills deserve to be seen in context.</span>
          <a
            href="#trust"
            className="inline-flex min-h-8 items-center gap-1 text-teal-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            See how evidence is labeled
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </PageContainer>
      </div>
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="overflow-hidden bg-warm">
          <PageContainer className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 lg:py-20">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-white px-3.5 py-1.5 text-sm font-semibold text-teal-700">
                <ShieldCheck size={16} aria-hidden="true" />
                Evidence-backed skills
              </div>
              <h1 className="text-[3.25rem] font-bold leading-[0.98] tracking-[-0.045em] text-navy sm:text-7xl lg:text-[5.5rem]">
                Show what
                <br />
                you can do.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slatebody sm:text-xl">
                Turn projects, practical work and assessment results into a clear picture
                of your abilities—beyond formal certificates alone.
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
              <p className="mt-5 max-w-lg text-sm leading-6 text-slatebody">
                You review AI suggestions. Each status explains what the evidence does—and
                does not—show.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-teal/15 sm:h-48 sm:w-48"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-8 -left-7 h-32 w-32 rounded-full border-[18px] border-navy/5 sm:h-40 sm:w-40"
              />
              <div className="relative min-h-[390px] overflow-hidden rounded-[2rem] bg-teal/10 p-4 sm:min-h-[470px] sm:p-8">
                <div
                  aria-hidden="true"
                  className="absolute right-8 top-8 h-16 w-16 rounded-2xl bg-teal/20 sm:right-12 sm:top-10 sm:h-24 sm:w-24"
                />
                <div className="relative mx-auto mt-5 max-w-md rounded-2xl border border-navy/10 bg-white p-5 shadow-soft sm:mt-8 sm:p-7">
                  <div className="flex items-start justify-between gap-3 border-b border-navy/10 pb-5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-white">
                        <UserRound size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slatebody">Illustrative profile</p>
                        <h2 className="mt-0.5 text-lg font-bold text-navy">Skills Passport</h2>
                        <p className="text-sm text-slatebody">Practical work, in context</p>
                      </div>
                    </div>
                    <span className="hidden items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal-700 sm:inline-flex">
                      <ShieldCheck size={14} aria-hidden="true" />
                      Your profile
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      {
                        icon: FileCheck2,
                        title: 'Responsive layout',
                        detail: 'Project work sample',
                        status: 'Evidence submitted',
                      },
                      {
                        icon: ClipboardCheck,
                        title: 'Semantic HTML',
                        detail: 'Practical rubric review',
                        status: 'AI-assisted assessment',
                      },
                      {
                        icon: BriefcaseBusiness,
                        title: 'Project communication',
                        detail: 'Candidate description',
                        status: 'Self-reported',
                      },
                    ].map((skill) => (
                      <div key={skill.title} className="flex items-start gap-3 rounded-xl bg-warm p-3.5">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-teal">
                          <skill.icon size={16} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-navy">{skill.title}</p>
                          <p className="mt-0.5 text-xs text-slatebody">{skill.detail}</p>
                        </div>
                        <span className="hidden sm:block">
                          <EvidenceStatusBadge
                            label={skill.status as 'Self-reported' | 'Evidence submitted' | 'AI-assisted assessment'}
                          />
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t border-navy/10 pt-4 text-sm font-semibold text-navy">
                    <BadgeCheck size={18} className="shrink-0 text-teal" aria-hidden="true" />
                    The source is shown beside each skill
                  </div>
                </div>
                <div className="absolute bottom-4 right-3 flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-xs font-semibold text-navy shadow-card sm:bottom-8 sm:right-1 sm:px-4 sm:py-3 sm:text-sm">
                  <Sparkles size={16} className="text-teal" aria-hidden="true" />
                  AI-assisted, never a certification
                </div>
              </div>
            </div>
          </PageContainer>
        </section>

        <section aria-label="Joby AI principles" className="border-y border-navy/10 bg-white">
          <PageContainer className="grid gap-5 py-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-navy/10 sm:py-7">
            {[
              ['Grounded in evidence', 'Connect skills to real work.'],
              ['Clear about AI', 'Suggestions are reviewed by you.'],
              ['Private by default', 'Share only what you choose.'],
            ].map(([title, text]) => (
              <div key={title} className="flex items-start gap-3 sm:px-6 first:sm:pl-0 last:sm:pr-0">
                <Check size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
                <div>
                  <p className="font-bold text-navy">{title}</p>
                  <p className="mt-1 text-sm text-slatebody">{text}</p>
                </div>
              </div>
            ))}
          </PageContainer>
        </section>

        <section id="how-it-works" className="bg-white">
          <PageContainer className="py-16 sm:py-20 lg:py-24">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">How it works</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-5xl">
                  From practical work to a shareable profile.
                </h2>
              </div>
              <p className="max-w-md leading-7 text-slatebody">
                A straightforward way to gather your work, understand what it demonstrates,
                and decide what to share.
              </p>
            </div>

            <div className="mt-12 grid gap-8 border-t border-navy/15 pt-7 md:grid-cols-3 md:gap-7">
              {workflow.map((item) => (
                <article key={item.step} className="relative">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold tracking-[0.16em] text-teal-700">{item.step}</span>
                    <span className="h-px flex-1 bg-navy/10 md:hidden" />
                    <item.icon size={21} className="text-teal" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-navy sm:text-2xl">{item.title}</h3>
                  <p className="mt-3 max-w-sm leading-7 text-slatebody">{item.text}</p>
                </article>
              ))}
            </div>
          </PageContainer>
        </section>

        <section id="features" className="bg-warm">
          <PageContainer className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
            <div className="max-w-lg">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">What Joby AI provides</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-5xl">
                A fuller picture of what you can do.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slatebody">
                Useful experience can be hard to communicate when formal records are incomplete.
                Joby AI gives practical evidence a clear place in your story.
              </p>
              <a
                href="#trust"
                className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-700 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                Understand the evidence labels
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>

            <div className="divide-y divide-navy/10 border-y border-navy/10">
              {features.map((feature) => (
                <article key={feature.title} className="flex gap-4 py-5 sm:gap-6 sm:py-6">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-teal">
                    <feature.icon size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-navy">{feature.title}</h3>
                    <p className="mt-1.5 max-w-xl leading-7 text-slatebody">{feature.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </PageContainer>
        </section>

        <section id="trust" className="bg-navy text-white">
          <PageContainer className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-24">
            <div>
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-teal">
                <ShieldCheck size={23} aria-hidden="true" />
              </span>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Trust and transparency</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                AI assistance, without pretending to certify.
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-white/75">
                AI can help organize possible skills and review work against a fixed rubric.
                Suggestions remain subject to your review, and assessment feedback is not an
                official qualification.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  'You review every AI-suggested skill.',
                  'Evidence and assessment status remain separate.',
                  'A public passport only shows explicitly shared profile fields.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium text-white/90">
                    <Check size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-5 text-navy sm:p-8">
              <div className="mb-5 flex items-center gap-3 border-b border-navy/10 pb-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal">
                  <FileCheck2 size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold">What each status means</h3>
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

        <section id="get-started" className="bg-teal/10">
          <PageContainer className="flex flex-col items-start justify-between gap-7 py-12 sm:py-16 md:flex-row md:items-center">
            <div>
              <BriefcaseBusiness className="text-teal" size={25} aria-hidden="true" />
              <h2 className="mt-4 text-3xl font-bold text-navy sm:text-4xl">Put your work in context.</h2>
              <p className="mt-2 max-w-xl leading-7 text-slatebody">
                Create an evidence-backed profile that makes what you can do easier to understand.
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
