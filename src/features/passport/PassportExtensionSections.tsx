import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState, SuccessState } from '../../components/ui/Feedback'
import { SelectField } from '../../components/ui/SelectField'
import { displayDatabaseError } from '../../lib/displayErrors'
import { proficiencyLabels } from '../skills/skillSchema'
import {
  createPassportCredential,
  createPassportExperience,
  createPassportShareLink,
  listCredentialIssuerRequests,
  listCareerPaths,
  listPassportShareLinks,
  revokePassportShareLink,
  registerCredentialIssuer,
  setCredentialVisibility,
  setExperienceVisibility,
  type CareerPath,
  type CredentialIssuer,
  type PassportCredential,
  type PassportExperience,
  type PassportShareLink,
} from './passportService'
import {
  credentialInputSchema,
  credentialTypes,
  experienceInputSchema,
  credentialIssuerRequestSchema,
  type CredentialInput,
  type CredentialIssuerRequest,
  type ExperienceInput,
} from './passportSchema'
import type { Skill } from '../skills/skillSchema'

const emptyCredential: CredentialInput = {
  title: '',
  credential_type: 'certificate',
  issuer_name: '',
  description: '',
  issued_at: '',
  expires_at: '',
  credential_identifier: '',
}
const emptyExperience: ExperienceInput = {
  experience_type: 'employment',
  title: '',
  organization: '',
  description: '',
  location: '',
  started_at: '',
  ended_at: '',
  is_current: false,
  visibility: 'private',
}
const emptyIssuer: CredentialIssuerRequest = {
  display_name: '',
  issuer_url: '',
  issuer_type: 'education',
}
const shareSections = ['profile', 'skills', 'credentials', 'experience', 'assessments']

type Props = {
  userId: string
  targetRole: string
  skills: Skill[]
  credentials: PassportCredential[]
  experiences: PassportExperience[]
  onChanged: () => Promise<void>
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-xl font-bold text-navy">{children}</h2>
}

function CredentialForm({ userId, onSaved }: { userId: string; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState(emptyCredential)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const parsed = credentialInputSchema.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the credential details.')
      return
    }
    setSaving(true)
    try {
      await createPassportCredential(userId, parsed.data)
      setDraft(emptyCredential)
      await onSaved()
    } catch (cause) {
      setError(displayDatabaseError(cause))
    } finally {
      setSaving(false)
    }
  }
  return (
    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
      {error && <div className="sm:col-span-2"><ErrorState>{error}</ErrorState></div>}
      <label className="text-sm font-semibold text-navy">Credential name
        <input required maxLength={160} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
      </label>
      <SelectField label="Credential type" value={draft.credential_type} onChange={(e) => setDraft({ ...draft, credential_type: e.target.value as CredentialInput['credential_type'] })}>
        {credentialTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
      </SelectField>
      <label className="text-sm font-semibold text-navy">Issuer
        <input required maxLength={160} value={draft.issuer_name} onChange={(e) => setDraft({ ...draft, issuer_name: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
      </label>
      <label className="text-sm font-semibold text-navy">Credential ID (optional)
        <input maxLength={160} value={draft.credential_identifier} onChange={(e) => setDraft({ ...draft, credential_identifier: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
      </label>
      <label className="text-sm font-semibold text-navy">Issue date
        <input type="date" value={draft.issued_at} onChange={(e) => setDraft({ ...draft, issued_at: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
      </label>
      <label className="text-sm font-semibold text-navy">Expiry date
        <input type="date" value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
      </label>
      <label className="text-sm font-semibold text-navy sm:col-span-2">Details
        <textarea maxLength={2000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-1 min-h-20 w-full rounded-lg border border-navy/15 p-3 font-normal" />
      </label>
      <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add credential to wallet'}</Button></div>
    </form>
  )
}

function ExperienceForm({ userId, onSaved }: { userId: string; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState(emptyExperience)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const parsed = experienceInputSchema.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the experience details.')
      return
    }
    setSaving(true)
    try {
      await createPassportExperience(userId, parsed.data)
      setDraft(emptyExperience)
      await onSaved()
    } catch (cause) {
      setError(displayDatabaseError(cause))
    } finally {
      setSaving(false)
    }
  }
  return (
    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
      {error && <div className="sm:col-span-2"><ErrorState>{error}</ErrorState></div>}
      <SelectField label="Record type" value={draft.experience_type} onChange={(e) => setDraft({ ...draft, experience_type: e.target.value as ExperienceInput['experience_type'] })}>
        <option value="employment">Employment</option><option value="project">Project</option><option value="volunteer">Volunteer</option>
      </SelectField>
      <label className="text-sm font-semibold text-navy">Role or project
        <input required maxLength={160} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
      </label>
      <label className="text-sm font-semibold text-navy">Organization (optional)
        <input maxLength={160} value={draft.organization} onChange={(e) => setDraft({ ...draft, organization: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
      </label>
      <label className="text-sm font-semibold text-navy">Start date
        <input type="date" value={draft.started_at} onChange={(e) => setDraft({ ...draft, started_at: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
      </label>
      <label className="text-sm font-semibold text-navy">End date
        <input type="date" disabled={draft.is_current} value={draft.ended_at} onChange={(e) => setDraft({ ...draft, ended_at: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal disabled:bg-warm" />
      </label>
      <label className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={draft.is_current} onChange={(e) => setDraft({ ...draft, is_current: e.target.checked, ended_at: e.target.checked ? '' : draft.ended_at })} />Currently active</label>
      <label className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={draft.visibility === 'public'} onChange={(e) => setDraft({ ...draft, visibility: e.target.checked ? 'public' : 'private' })} />Allow in public passport</label>
      <label className="text-sm font-semibold text-navy sm:col-span-2">Description
        <textarea maxLength={3000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-1 min-h-20 w-full rounded-lg border border-navy/15 p-3 font-normal" />
      </label>
      <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add experience'}</Button></div>
    </form>
  )
}

export function PassportExtensionSections({ userId, targetRole, skills, credentials, experiences, onChanged }: Props) {
  const [paths, setPaths] = useState<CareerPath[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState('all')
  const [links, setLinks] = useState<PassportShareLink[]>([])
  const [issuerRequests, setIssuerRequests] = useState<CredentialIssuer[]>([])
  const [issuerDraft, setIssuerDraft] = useState(emptyIssuer)
  const [sections, setSections] = useState<string[]>(['profile', 'skills'])
  const [skillIds, setSkillIds] = useState<string[]>(skills.map((item) => item.id))
  const [credentialIds, setCredentialIds] = useState<string[]>(credentials.map((item) => item.id))
  const [experienceIds, setExperienceIds] = useState<string[]>(experiences.map((item) => item.id))
  const [expiresAt, setExpiresAt] = useState('')
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareQr, setShareQr] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const refreshLinks = async () => setLinks(await listPassportShareLinks(userId))
  useEffect(() => {
    let active = true
    if (!shareToken) {
      setShareQr(null)
      return
    }
    import('qrcode').then(({ toDataURL }) => toDataURL(
      new URL(`/p/${shareToken}`, window.location.origin).toString(),
      { errorCorrectionLevel: 'M', margin: 2, width: 220 },
    )).then((dataUrl) => { if (active) setShareQr(dataUrl) })
      .catch((cause: unknown) => { if (active) setError(displayDatabaseError(cause)) })
    return () => { active = false }
  }, [shareToken])
  useEffect(() => {
    let active = true
    Promise.all([listCareerPaths(userId), listPassportShareLinks(userId), listCredentialIssuerRequests(userId)])
      .then(([careerPaths, shareLinks, issuerProfiles]) => {
        if (active) {
          setPaths(careerPaths)
          setLinks(shareLinks)
          setIssuerRequests(issuerProfiles)
          const normalizedTarget = targetRole.trim().toLocaleLowerCase()
          const targetPath = careerPaths.find((path) =>
            path.title.trim().toLocaleLowerCase() === normalizedTarget
            || path.slug.replace(/-/g, ' ').toLocaleLowerCase() === normalizedTarget)
          if (targetPath) setSelectedRoleId(targetPath.id)
        }
      })
      .catch((cause: unknown) => { if (active) setError(displayDatabaseError(cause)) })
    return () => { active = false }
  }, [userId, targetRole])

  const updateVisibility = async (type: 'credential' | 'experience', id: string, visibility: 'private' | 'public') => {
    setError(null)
    try {
      if (type === 'credential') await setCredentialVisibility(userId, id, visibility)
      else await setExperienceVisibility(userId, id, visibility)
      await onChanged()
    } catch (cause) { setError(displayDatabaseError(cause)) }
  }

  const toggle = (values: string[], setValues: (next: string[]) => void, id: string) => {
    setValues(values.includes(id) ? values.filter((value) => value !== id) : [...values, id])
  }

  const createLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setShareToken(null)
    try {
      const token = await createPassportShareLink({
        label: 'Selected Skills Passport',
        sections,
        skillIds: skillIds.length ? skillIds : [],
        credentialIds: credentialIds.length ? credentialIds : [],
        experienceIds: experienceIds.length ? experienceIds : [],
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      setShareToken(token)
      setSuccess('A private, revocable share link was created. Copy it now; the token is not stored in readable form.')
      await refreshLinks()
    } catch (cause) { setError(displayDatabaseError(cause)) }
  }

  const copyShareLink = async () => {
    if (!shareToken) return
    try {
      await navigator.clipboard.writeText(new URL(`/p/${shareToken}`, window.location.origin).toString())
      setSuccess('Share link copied.')
      setError(null)
    } catch {
      setError('Could not access the clipboard. Select and copy the share link above.')
    }
  }

  const revoke = async (id: string) => {
    setError(null)
    try { await revokePassportShareLink(id); await refreshLinks() }
    catch (cause) { setError(displayDatabaseError(cause)) }
  }

  const submitIssuerRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const parsed = credentialIssuerRequestSchema.safeParse(issuerDraft)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the issuer profile details.')
      return
    }
    try {
      await registerCredentialIssuer(userId, parsed.data)
      setIssuerDraft(emptyIssuer)
      setIssuerRequests(await listCredentialIssuerRequests(userId))
      setSuccess('Issuer profile submitted for review. It is not verified yet.')
    } catch (cause) {
      setError(displayDatabaseError(cause))
    }
  }

  return (
    <div className="space-y-8">
      {error && <ErrorState>{error}</ErrorState>}
      {success && <SuccessState>{success}</SuccessState>}

      <section aria-labelledby="credential-wallet-heading">
        <div className="mb-4"><SectionTitle>Credential wallet</SectionTitle><p className="mt-1 text-sm text-slatebody">Manually added records are self-reported until authenticated issuer verification is available.</p></div>
        <Card className="p-5 shadow-card sm:p-7">
          {credentials.length > 0 && <ul className="mb-5 divide-y divide-navy/10">{credentials.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="font-semibold text-navy">{item.title}</p><p className="text-sm text-slatebody">{item.issuer_name} · {item.credential_type.replace(/_/g, ' ')} · {(item.expires_at && Date.parse(item.expires_at) < Date.now() ? 'expired' : item.status.replace(/_/g, ' '))}</p>
                {(item.issued_at || item.expires_at) && <p className="text-xs text-slatebody">Issued {item.issued_at || 'date not provided'}{item.expires_at ? ` · Expires ${item.expires_at}` : ''}</p>}
                {item.events.length > 0 && <p className="mt-1 text-xs text-slatebody">Audit trail: {item.events.map((event) => `${event.event_type} ${new Date(event.created_at).toLocaleDateString()}`).join(' · ')}</p>}
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.visibility === 'public'} onChange={(e) => void updateVisibility('credential', item.id, e.target.checked ? 'public' : 'private')} />Public summary</label>
            </li>
          ))}</ul>}
          {credentials.length === 0 && <p className="mb-4 text-sm text-slatebody">Your credential records will appear here.</p>}
          <CredentialForm userId={userId} onSaved={onChanged} />
          <div className="mt-7 border-t border-navy/10 pt-5">
            <h3 className="font-bold text-navy">Issuer profiles</h3>
            <p className="mt-1 text-sm text-slatebody">Issuer claims are pending until an administrator verifies the organization and its public signing key.</p>
            {issuerRequests.length > 0 && <ul className="mt-3 space-y-2">{issuerRequests.map((issuer) => (
              <li key={issuer.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{issuer.display_name} · <a href={issuer.issuer_url} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{issuer.issuer_url}</a></span><span className="capitalize text-slatebody">{issuer.verification_status}</span></li>
            ))}</ul>}
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={(event) => void submitIssuerRequest(event)}>
              <label className="text-sm font-semibold text-navy">Organization name
                <input required maxLength={120} value={issuerDraft.display_name} onChange={(e) => setIssuerDraft({ ...issuerDraft, display_name: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold text-navy">Issuer HTTPS website
                <input required type="url" maxLength={2048} value={issuerDraft.issuer_url} onChange={(e) => setIssuerDraft({ ...issuerDraft, issuer_url: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
              </label>
              <SelectField label="Issuer category" value={issuerDraft.issuer_type} onChange={(e) => setIssuerDraft({ ...issuerDraft, issuer_type: e.target.value as CredentialIssuerRequest['issuer_type'] })}>
                <option value="education">Education</option><option value="employer">Employer</option><option value="certification_body">Certification body</option><option value="other">Other</option>
              </SelectField>
              <div className="sm:col-span-3"><Button type="submit">Submit issuer for review</Button></div>
            </form>
          </div>
        </Card>
      </section>

      <section aria-labelledby="experience-heading">
        <div className="mb-4"><SectionTitle>Work, projects and volunteering</SectionTitle><p className="mt-1 text-sm text-slatebody">Build a structured record of roles, portfolio work and community contributions.</p></div>
        <Card className="p-5 shadow-card sm:p-7">
          {experiences.length > 0 && <ul className="mb-5 divide-y divide-navy/10">{experiences.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="font-semibold text-navy">{item.title}{item.organization ? ` · ${item.organization}` : ''}</p><p className="text-sm capitalize text-slatebody">{item.experience_type}{item.started_at ? ` · ${item.started_at}` : ''}{item.is_current ? ' · Current' : item.ended_at ? ` – ${item.ended_at}` : ''}</p>{item.description && <p className="mt-1 max-w-3xl text-sm text-slatebody">{item.description}</p>}</div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.visibility === 'public'} onChange={(e) => void updateVisibility('experience', item.id, e.target.checked ? 'public' : 'private')} />Public</label>
            </li>
          ))}</ul>}
          <ExperienceForm userId={userId} onSaved={onChanged} />
        </Card>
      </section>

      <section aria-labelledby="career-paths-heading">
        <div className="mb-4"><SectionTitle>Career and learning matches</SectionTitle><p className="mt-1 text-sm text-slatebody">Compare your registered skills with the available role requirements. Skill names and shared taxonomy codes are used; a match does not verify a skill.</p></div>
        {paths.length > 0 && <div className="mb-4 max-w-md">
          <SelectField label="Career role" value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)}>
            <option value="all">Compare all available roles</option>
            {paths.map((path) => <option key={path.id} value={path.id}>{path.title}</option>)}
          </SelectField>
          {targetRole && <p className="mt-1 text-xs text-slatebody">Your profile target role: {targetRole}</p>}
        </div>}
        {paths.length === 0 && <Card className="p-5 text-sm text-slatebody">
          Career roles are not available right now. Please try again later.
        </Card>}
        <div className="grid gap-4 md:grid-cols-2">{paths.filter((path) => selectedRoleId === 'all' || path.id === selectedRoleId).map((path) => (
          <Card key={path.id} className="p-5 shadow-card">
            <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-navy">{path.title}</h3><span className="text-sm font-semibold text-teal-700">{path.matchPercent}% match</span></div>
            <p className="mt-1 text-xs text-slatebody">{path.framework} · {path.region} · {path.qualification_level}</p>
            {path.requiredSkills.length > 0 ? <>
              <p className="mt-3 text-sm text-slatebody">{path.matchedSkills.length} of {path.requiredSkills.length} required skills found ({path.verifiedMatchedSkills.length} verified).</p>
              {path.matchedSkills.length > 0 && <p className="mt-2 text-sm text-slatebody"><span className="font-semibold text-navy">Skills you have:</span> {path.matchedSkills.map((name) => `${name}${path.verifiedMatchedSkills.includes(name) ? ' (verified)' : ''}`).join(', ')}.</p>}
              {path.missingSkills.length > 0 && <p className="mt-2 text-sm text-slatebody"><span className="font-semibold text-navy">Skills to build:</span> {path.missingSkills.join(', ')}.</p>}
              {path.matchedSkills.length === 0 && <Link to="/skills" className="mt-3 inline-flex font-semibold text-teal-700 underline">Add your skills to see your match</Link>}
            </> : <p className="mt-3 text-sm text-slatebody">No required skills are configured for this role yet.</p>}
            {path.resources.length > 0 && <ul className="mt-3 space-y-2 border-t border-navy/10 pt-3">{path.resources.map((resource) => (
              <li key={resource.id}><a href={resource.resource_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-700 underline">{resource.skill_name}: {resource.title}</a><span className="ml-1 text-xs text-slatebody">({resource.provider})</span></li>
            ))}</ul>}
          </Card>
        ))}</div>
        {skills.length > 0 && <p className="mt-2 text-xs text-slatebody">Skill proficiency shown in your profile: {skills.map((s) => `${s.name} — ${s.verified_level ? `verified ${proficiencyLabels[s.verified_level]}` : `self-reported ${proficiencyLabels[s.self_reported_level]}`}`).join('; ')}.</p>}
      </section>

      <section aria-labelledby="controlled-sharing-heading">
        <div className="mb-4"><SectionTitle>Controlled share links</SectionTitle><p className="mt-1 text-sm text-slatebody">Create a separate link with selected sections and an optional expiry date. Each link can be revoked independently.</p></div>
        <Card className="p-5 shadow-card sm:p-7">
          <form onSubmit={(event) => void createLink(event)} className="space-y-4">
            <fieldset><legend className="mb-2 text-sm font-semibold text-navy">Visible sections</legend><div className="flex flex-wrap gap-4">{shareSections.map((section) => (
              <label key={section} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" checked={sections.includes(section)} onChange={() => toggle(sections, setSections, section)} />{section}</label>
            ))}</div></fieldset>
            {sections.includes('skills') && skills.length > 0 && <fieldset><legend className="mb-2 text-sm font-semibold text-navy">Skills to include</legend><div className="flex flex-wrap gap-3">{skills.map((skill) => <label key={skill.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={skillIds.includes(skill.id)} onChange={() => toggle(skillIds, setSkillIds, skill.id)} />{skill.name}</label>)}</div></fieldset>}
            {sections.includes('credentials') && credentials.length > 0 && <fieldset><legend className="mb-2 text-sm font-semibold text-navy">Public credentials to include</legend><div className="flex flex-wrap gap-3">{credentials.filter((c) => c.visibility === 'public').map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={credentialIds.includes(item.id)} onChange={() => toggle(credentialIds, setCredentialIds, item.id)} />{item.title}</label>)}</div><p className="mt-1 text-xs text-slatebody">Credential summaries must also be marked public.</p></fieldset>}
            {sections.includes('experience') && experiences.length > 0 && <fieldset><legend className="mb-2 text-sm font-semibold text-navy">Public experience to include</legend><div className="flex flex-wrap gap-3">{experiences.filter((e) => e.visibility === 'public').map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={experienceIds.includes(item.id)} onChange={() => toggle(experienceIds, setExperienceIds, item.id)} />{item.title}</label>)}</div></fieldset>}
            <label className="block max-w-xs text-sm font-semibold text-navy">Optional expiry
              <input type="datetime-local" value={expiresAt} min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-navy/15 px-3 font-normal" />
            </label>
            <Button type="submit" disabled={!sections.length}>Create secure share link</Button>
          </form>
          {shareToken && <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-warm p-4"><div><p className="text-sm font-semibold text-navy">Copy this link now</p><code className="mt-1 block break-all text-sm">{new URL(`/p/${shareToken}`, window.location.origin).toString()}</code><Button type="button" className="mt-3" variant="secondary" onClick={() => void copyShareLink()}>Copy share link</Button></div>{shareQr && <img src={shareQr} alt="QR code for the revocable Skills Passport share link" width="160" height="160" className="rounded bg-white p-2" />}</div>}
          {links.length > 0 && <ul className="mt-5 divide-y divide-navy/10">{links.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold text-navy">{link.label} · {link.sections.join(', ')}</p><p className="text-xs text-slatebody">Created {new Date(link.created_at).toLocaleString()}{link.expires_at ? ` · Expires ${new Date(link.expires_at).toLocaleString()}` : ''}{link.revoked_at ? ' · Revoked' : ''}</p></div>{!link.revoked_at && <Button variant="secondary" onClick={() => void revoke(link.id)}>Revoke link</Button>}</li>
          ))}</ul>}
        </Card>
      </section>
    </div>
  )
}
