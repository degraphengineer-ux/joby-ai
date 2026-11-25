import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  FileText,
  Globe2,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
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
    title: 'Built for many career paths',
    text: 'From web development to creative and operational work, the process starts with evidence.',
  },
  {
    icon: LockKeyhole,
    title: 'Privacy stays with you',
    text: 'Private evidence remains separate from optional public profile sharing.',
  },
]

export function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-warm text-navy">
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="overflow-hidden border-b border-navy/5 bg-white">
          <PageContainer className="grid items-center gap-12 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-3.5 py-1.5 text-sm font-semibold text-teal-700">
                <ShieldCheck size={16} aria-hidden="true" />
                Evidence-backed skills
              </div>
              <h1 className="text-[2.75rem] font-bold leading-[1.08] tracking-tight text-navy sm:text-6xl lg:text-[4.25rem]">
                Show what you can do.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slatebody sm:text-xl">
                Joby AI helps you turn projects, practical work and assessment results
                into a clear picture of what you can do—beyond formal certificates alone.
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
                A skills profile should explain the source of each claim, not turn
                an AI suggestion into a guarantee.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <Card className="p-5 shadow-soft sm:p-7">
                <div className="flex flex-col items-start justify-between gap-4 border-b border-navy/10 pb-5 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-semibold text-slatebody">Illustrative example</p>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Skills Passport</p>
                    <h2 className="mt-2 text-xl font-bold">Professional profile</h2>
                    <p className="mt-1 text-sm text-slatebody">Projects and practical evidence</p>
                  </div>
                  <EvidenceStatusBadge label="Evidence submitted" />
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      name: 'Responsive layout',
                      detail: 'Project work sample',
                      status: 'Evidence submitted',
                    },
                    {
                      name: 'Semantic HTML',
                      detail: 'Practical rubric review',
                      status: 'AI-assisted assessment',
                    },
                    {
                      name: 'Project communication',
                      detail: 'Candidate description',
                      status: 'Self-reported',
                    },
                  ].map((skill) => (
                    <div
                      key={skill.name}
                      className="flex flex-col items-start justify-between gap-3 rounded-lg border border-navy/8 px-4 py-3 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-bold">{skill.name}</p>
                        <p className="mt-1 text-xs text-slatebody">{skill.detail}</p>
                      </div>
                      <EvidenceStatusBadge
                        label={skill.status as 'Self-reported' | 'Evidence submitted' | 'AI-assisted assessment'}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-lg bg-warm px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <BadgeCheck size={17} className="text-teal" aria-hidden="true" />
                    Status is explained beside every skill
                  </p>
                </div>
              </Card>
            </div>
          </PageContainer>
        </section>

        <section className="border-b border-navy/5 bg-warm">
          <PageContainer className="py-10 sm:py-12">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                ['The challenge', 'Useful experience can be overlooked when formal records are incomplete.'],
                ['The approach', 'Combine user-owned evidence with structured, role-relevant assessment.'],
                ['The result', 'A readable profile that explains what was reported, submitted or assessed.'],
              ].map(([title, text]) => (
                <div key={title} className="border-l-2 border-teal pl-5">
                  <h2 className="text-sm font-bold text-navy">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slatebody">{text}</p>
                </div>
              ))}
            </div>
          </PageContainer>
        </section>

        <section id="how-it-works" className="bg-white">
          <PageContainer className="py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                From practical work to a shareable profile.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {workflow.map((item) => (
                <Card key={item.step} className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal/10 text-teal">
                      <item.icon size={22} aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold tracking-[0.16em] text-navy/30">{item.step}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slatebody">{item.text}</p>
                </Card>
              ))}
            </div>
          </PageContainer>
        </section>

        <section id="features" className="border-y border-navy/5 bg-warm">
          <PageContainer className="py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div className="lg:sticky lg:top-24">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">What Joby AI provides</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  A clearer way to communicate ability.
                </h2>
                <p className="mt-5 leading-7 text-slatebody">
                  Built around practical evidence and transparent labels, so a profile
                  remains useful without overstating what it proves.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <Card key={feature.title} className="p-6">
                    <feature.icon size={22} className="text-teal" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
                    <p className="mt-2 leading-7 text-slatebody">{feature.text}</p>
                  </Card>
                ))}
              </div>
            </div>
          </PageContainer>
        </section>

        <section id="trust" className="bg-white">
          <PageContainer className="py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-navy text-white">
                  <Sparkles size={22} aria-hidden="true" />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Trust and transparency</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  AI assistance, without pretending to certify.
                </h2>
                <p className="mt-5 max-w-xl leading-8 text-slatebody">
                  Joby AI uses AI to help organize possible skills and review evidence
                  against a fixed rubric. Suggestions remain subject to user review,
                  and assessment feedback is not an official qualification.
                </p>
                <ul className="mt-7 space-y-3">
                  {[
                    'You review every AI-suggested skill.',
                    'Evidence and assessment status remain separate.',
                    'A public passport only shows explicitly shared profile fields.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm font-medium">
                      <Check size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Card className="divide-y divide-navy/8 p-6 sm:p-8">
                {[
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
                ].map((status) => (
                  <div key={status.label} className="py-5 first:pt-0 last:pb-0">
                    <EvidenceStatusBadge
                      label={status.label as 'Self-reported' | 'Evidence submitted' | 'AI-assisted assessment'}
                    />
                    <p className="mt-3 text-sm leading-6 text-slatebody">{status.text}</p>
                  </div>
                ))}
              </Card>
            </div>
          </PageContainer>
        </section>

        <section id="get-started" className="border-t border-navy/5 bg-navy">
          <PageContainer className="flex flex-col items-start justify-between gap-7 py-12 md:flex-row md:items-center">
            <div>
              <BriefcaseBusiness className="text-teal" size={25} aria-hidden="true" />
              <h2 className="mt-4 text-3xl font-bold text-white">Put your work in context.</h2>
              <p className="mt-2 max-w-xl text-white/70">
                Create an evidence-backed profile that makes what you can do easier to understand.
              </p>
            </div>
            <ButtonLink href="/signup" size="lg" variant="secondary" className="shrink-0">
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
