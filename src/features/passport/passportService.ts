import { supabase } from '../../lib/supabase'
import { getProfile } from '../profile/profileService'
import type { Profile } from '../profile/profileSchema'
import { listEvidence } from '../evidence/evidenceService'
import type { EvidenceRecord } from '../evidence/evidenceSchema'
import { listSkills } from '../skills/skillsService'
import type { Skill } from '../skills/skillSchema'
import { assessmentFeedbackSchema } from '../assessments/assessmentSchema'
import {
  credentialInputSchema,
  credentialIssuerRequestSchema,
  experienceInputSchema,
  publicPassportSchema,
  type CredentialInput,
  type CredentialIssuerRequest,
  type ExperienceInput,
  type PublicPassport,
} from './passportSchema'
import { matchCareerRequirements, type CareerSkillRequirement } from './careerMatching'

export type PassportReviewRecord = {
  evidence_id: string
  decision: 'accepted' | 'needs_changes' | 'rejected'
  reviewed_at: string
}

export type PassportExternalCredential = {
  evidence_id: string
  credential_name: string
  provider: string
  verified_at: string
}

export type PassportEvidence = EvidenceRecord & {
  linkedSkills: Skill[]
  reviews: PassportReviewRecord[]
  externalCredentials: PassportExternalCredential[]
}

export type PassportAssessment = {
  id: string
  title: string
  category: string
  completed_at: string
  assessment_method: 'ai_assisted' | 'human_review'
  total_score: number
  max_score: number
  criteria: {
    criterion: string
    score: number
    max_score: number
    feedback: string
  }[]
  overall_summary: string
}

export type CredentialEvent = {
  event_type: 'created' | 'updated' | 'verified' | 'revoked' | 'expired' | 'visibility_changed'
  event_data: Record<string, unknown>
  created_at: string
}

export type PassportCredential = {
  id: string
  user_id: string
  issuer_id: string | null
  evidence_id: string | null
  title: string
  credential_type: CredentialInput['credential_type']
  issuer_name: string
  description: string | null
  credential_identifier: string | null
  issued_at: string | null
  expires_at: string | null
  status: 'self_reported' | 'pending_verification' | 'verified' | 'expired' | 'revoked'
  visibility: 'private' | 'public'
  revoked_at: string | null
  proof: Record<string, unknown> | null
  credential_data: Record<string, unknown>
  events: CredentialEvent[]
  created_at: string
  updated_at: string
}

export type PassportExperience = {
  id: string
  user_id: string
  experience_type: ExperienceInput['experience_type']
  title: string
  organization: string | null
  description: string | null
  location: string | null
  started_at: string | null
  ended_at: string | null
  is_current: boolean
  visibility: 'private' | 'public'
  created_at: string
  updated_at: string
}

export type CareerPath = {
  id: string
  slug: string
  title: string
  framework: string
  region: string
  qualification_level: string | null
  requiredSkills: string[]
  matchedSkills: string[]
  verifiedMatchedSkills: string[]
  missingSkills: string[]
  matchPercent: number
  resources: { id: string; skill_name: string; title: string; provider: string; resource_url: string; resource_type: string }[]
}

export type PassportShareLink = {
  id: string
  label: string
  sections: string[]
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

export type CredentialIssuer = {
  id: string
  display_name: string
  issuer_url: string
  issuer_type: CredentialIssuerRequest['issuer_type']
  verification_status: 'pending' | 'verified' | 'suspended'
  verified_at: string | null
}

export type PrivatePassport = {
  profile: Profile
  skills: Skill[]
  evidence: PassportEvidence[]
  credentials: PassportCredential[]
  experiences: PassportExperience[]
  assessments: PassportAssessment[]
  invalidAssessmentCount: number
  lastUpdatedAt: string
}

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key.')
  }
  return supabase
}

function newestDate(values: Array<string | null | undefined>, fallback: string): string {
  return values.reduce<string>((latest, value) => {
    if (!value) return latest
    return Date.parse(value) > Date.parse(latest) ? value : latest
  }, fallback)
}

export async function getPrivatePassport(userId: string): Promise<PrivatePassport | null> {
  const client = getClient()
  const [profile, skills, evidence] = await Promise.all([
    getProfile(userId),
    listSkills(userId),
    listEvidence(userId),
  ])
  if (!profile) return null

  const [linksResult, reviewsResult, externalCredentialsResult, attemptsResult, credentialsResult, experiencesResult, credentialEventsResult] = await Promise.all([
    skills.length
      ? client
          .from('skill_evidence')
          .select('skill_id,evidence_id')
          .in('skill_id', skills.map((skill) => skill.id))
      : Promise.resolve({ data: [], error: null }),
    evidence.length
      ? client
          .from('review_records')
          .select('evidence_id,decision,reviewed_at')
          .in('evidence_id', evidence.map((item) => item.id))
      : Promise.resolve({ data: [], error: null }),
    evidence.length
      ? client
          .from('external_credential_verifications')
          .select('evidence_id,credential_name,provider,verified_at')
          .in('evidence_id', evidence.map((item) => item.id))
      : Promise.resolve({ data: [], error: null }),
    client
      .from('assessment_attempts')
      .select('id,assessment_id,status,total_score,feedback,assessment_method,completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }),
    client.from('passport_credentials').select('*').eq('user_id', userId).order('issued_at', { ascending: false }),
    client.from('passport_experiences').select('*').eq('user_id', userId).order('started_at', { ascending: false }),
    client.from('credential_events').select('credential_id,event_type,event_data,created_at').order('created_at', { ascending: false }),
  ])

  const failed = [linksResult, reviewsResult, externalCredentialsResult, attemptsResult, credentialsResult, experiencesResult, credentialEventsResult]
    .find((result) => result.error)
  if (failed?.error) throw failed.error

  const skillById = new Map(skills.map((skill) => [skill.id, skill]))
  const evidenceById = new Map(evidence.map((item) => [item.id, item]))
  const linkedSkillIds = new Map<string, Set<string>>()
  for (const link of linksResult.data ?? []) {
    if (!evidenceById.has(link.evidence_id) || !skillById.has(link.skill_id)) continue
    const skillIds = linkedSkillIds.get(link.evidence_id) ?? new Set<string>()
    skillIds.add(link.skill_id)
    linkedSkillIds.set(link.evidence_id, skillIds)
  }

  const reviewsByEvidence = new Map<string, PassportReviewRecord[]>()
  for (const review of reviewsResult.data ?? []) {
    const records = reviewsByEvidence.get(review.evidence_id) ?? []
    records.push(review as PassportReviewRecord)
    reviewsByEvidence.set(review.evidence_id, records)
  }

  const externalCredentialsByEvidence = new Map<string, PassportExternalCredential[]>()
  for (const credential of externalCredentialsResult.data ?? []) {
    const records = externalCredentialsByEvidence.get(credential.evidence_id) ?? []
    records.push(credential as PassportExternalCredential)
    externalCredentialsByEvidence.set(credential.evidence_id, records)
  }

  const credentialEventsById = new Map<string, CredentialEvent[]>()
  for (const event of credentialEventsResult.data ?? []) {
    const records = credentialEventsById.get(event.credential_id) ?? []
    records.push({
      event_type: event.event_type,
      event_data: event.event_data as Record<string, unknown>,
      created_at: event.created_at,
    })
    credentialEventsById.set(event.credential_id, records)
  }

  const credentials = (credentialsResult.data ?? []).map((credential) => ({
    ...credential,
    events: credentialEventsById.get(credential.id) ?? [],
  })) as unknown as PassportCredential[]

  const evidenceWithLinks: PassportEvidence[] = evidence.map((item) => ({
    ...item,
    linkedSkills: [...(linkedSkillIds.get(item.id) ?? [])]
      .map((skillId) => skillById.get(skillId))
      .filter((skill): skill is Skill => Boolean(skill)),
    reviews: reviewsByEvidence.get(item.id) ?? [],
    externalCredentials: externalCredentialsByEvidence.get(item.id) ?? [],
  }))

  const assessments: PassportAssessment[] = []
  let invalidAssessmentCount = 0
  for (const attempt of attemptsResult.data ?? []) {
    const parsedFeedback = assessmentFeedbackSchema.safeParse(attempt.feedback)
    if (
      !parsedFeedback.success ||
      typeof attempt.total_score !== 'number' ||
      attempt.completed_at === null ||
      parsedFeedback.data.method_label !== (
        attempt.assessment_method === 'human_review'
          ? 'Human reviewed'
          : 'AI-assisted assessment'
      )
    ) {
      invalidAssessmentCount += 1
      continue
    }

    const maxScore = parsedFeedback.data.criteria.reduce(
      (total, criterion) => total + criterion.max_score,
      0,
    )
    const totalScore = parsedFeedback.data.criteria.reduce(
      (total, criterion) => total + criterion.score,
      0,
    )
    if (
      parsedFeedback.data.total_max_score !== maxScore ||
      attempt.total_score !== totalScore ||
      parsedFeedback.data.criteria.some((criterion) => criterion.score > criterion.max_score)
    ) {
      invalidAssessmentCount += 1
      continue
    }

    assessments.push({
      id: attempt.id,
      title: parsedFeedback.data.assessment_title,
      category: parsedFeedback.data.assessment_category,
      completed_at: attempt.completed_at,
      assessment_method: attempt.assessment_method,
      total_score: attempt.total_score,
      max_score: maxScore,
      criteria: parsedFeedback.data.criteria,
      overall_summary: parsedFeedback.data.overall_summary,
    })
  }

  return {
    profile,
    skills,
    evidence: evidenceWithLinks,
    credentials,
    experiences: (experiencesResult.data ?? []) as unknown as PassportExperience[],
    assessments,
    invalidAssessmentCount,
    lastUpdatedAt: newestDate(
      [
        profile.updated_at,
        ...skills.map((skill) => skill.updated_at),
        ...evidence.map((item) => item.updated_at),
        ...(credentialsResult.data ?? []).map((item) => item.updated_at),
        ...(experiencesResult.data ?? []).map((item) => item.updated_at),
        ...assessments.map((assessment) => assessment.completed_at),
        ...[...reviewsByEvidence.values()].flat().map((review) => review.reviewed_at),
        ...[...externalCredentialsByEvidence.values()].flat().map((credential) => credential.verified_at),
      ],
      profile.updated_at,
    ),
  }
}

export async function createPassportCredential(userId: string, input: CredentialInput): Promise<PassportCredential> {
    const parsed = credentialInputSchema.parse(input)
    const { data, error } = await getClient().from('passport_credentials').insert({
      user_id: userId,
      ...parsed,
      description: parsed.description || null,
      issued_at: parsed.issued_at || null,
      expires_at: parsed.expires_at || null,
      credential_identifier: parsed.credential_identifier || null,
    }).select('*').single()
    if (error) throw error
    return data as unknown as PassportCredential
  }

  export async function registerCredentialIssuer(userId: string, input: CredentialIssuerRequest): Promise<void> {
    const parsed = credentialIssuerRequestSchema.parse(input)
    const { error } = await getClient().from('credential_issuers').insert({
      owner_user_id: userId,
      ...parsed,
    })
    if (error) throw error
  }

  export async function listCredentialIssuerRequests(userId: string): Promise<CredentialIssuer[]> {
    const { data, error } = await getClient().from('credential_issuers')
      .select('id,display_name,issuer_url,issuer_type,verification_status,verified_at')
      .eq('owner_user_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return data as CredentialIssuer[]
  }

export async function setCredentialVisibility(userId: string, credentialId: string, visibility: 'private' | 'public') {
    const { data, error } = await getClient().from('passport_credentials')
      .update({ visibility }).eq('id', credentialId).eq('user_id', userId).select('id').maybeSingle()
    if (error) throw error
    if (!data) throw new Error('This credential could not be updated in your account.')
  }

export async function createPassportExperience(userId: string, input: ExperienceInput): Promise<PassportExperience> {
    const parsed = experienceInputSchema.parse(input)
    const { data, error } = await getClient().from('passport_experiences').insert({
      user_id: userId,
      ...parsed,
      organization: parsed.organization || null,
      description: parsed.description || null,
      location: parsed.location || null,
      started_at: parsed.started_at || null,
      ended_at: parsed.ended_at || null,
    }).select('*').single()
    if (error) throw error
    return data as unknown as PassportExperience
  }

export async function setExperienceVisibility(userId: string, experienceId: string, visibility: 'private' | 'public') {
    const { data, error } = await getClient().from('passport_experiences')
      .update({ visibility }).eq('id', experienceId).eq('user_id', userId).select('id').maybeSingle()
    if (error) throw error
    if (!data) throw new Error('This experience could not be updated in your account.')
  }

export async function listCareerPaths(userId: string): Promise<CareerPath[]> {
    const client = getClient()
    const [rolesResult, requirementsResult, skillsResult] = await Promise.all([
      client.from('career_roles').select('id,slug,title,framework,region,qualification_level').order('title'),
      client.from('career_role_skills').select('role_id,skill_name,taxonomy_framework,taxonomy_code,importance').order('skill_name'),
      client.from('skills').select('name,verified_level,taxonomy_framework,taxonomy_code').eq('user_id', userId),
    ])
    for (const result of [rolesResult, requirementsResult, skillsResult]) {
      if (result.error) throw result.error
    }
    const requirements = requirementsResult.data ?? []
    const userSkills = (skillsResult.data ?? []) as Pick<Skill, 'name' | 'verified_level' | 'taxonomy_framework' | 'taxonomy_code'>[]
    const missingNames = new Set<string>()
    const paths = (rolesResult.data ?? []).map((role) => {
      const roleRequirements = requirements.filter((item) => item.role_id === role.id)
      const requiredSkills = roleRequirements.map((item) => item.skill_name)
      const mappedRequirements: CareerSkillRequirement[] = roleRequirements.map((item) => ({
        name: item.skill_name,
        taxonomy_framework: item.taxonomy_framework,
        taxonomy_code: item.taxonomy_code,
      }))
      const match = matchCareerRequirements(mappedRequirements, userSkills)
      const { matchedSkills, missingSkills } = match
      missingSkills.forEach((name) => missingNames.add(name))
      return {
        ...role,
        requiredSkills,
        matchedSkills,
        verifiedMatchedSkills: match.verifiedMatchedSkills,
        missingSkills,
        matchPercent: match.matchPercent,
      }
    })
    const resourceResult = missingNames.size
      ? await client.from('learning_resources').select('id,skill_name,title,provider,resource_url,resource_type')
        .in('skill_name', [...missingNames])
      : { data: [], error: null }
    if (resourceResult.error) throw resourceResult.error
    return paths.map((path) => ({
      ...path,
      resources: (resourceResult.data ?? []).filter((resource) => path.missingSkills.includes(resource.skill_name)),
    })) as CareerPath[]
  }

export async function listPassportShareLinks(userId: string): Promise<PassportShareLink[]> {
    const { data, error } = await getClient().from('passport_share_links')
      .select('id,label,sections,expires_at,revoked_at,created_at').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return data as PassportShareLink[]
  }

export async function createPassportShareLink(input: {
    label: string
    sections: string[]
    skillIds: string[]
    credentialIds: string[]
    experienceIds: string[]
    expiresAt: string | null
  }): Promise<string> {
    const { data, error } = await getClient().rpc('create_passport_share_link', {
      p_label: input.label,
      p_sections: input.sections,
      p_skill_ids: input.skillIds,
      p_credential_ids: input.credentialIds,
      p_experience_ids: input.experienceIds,
      p_expires_at: input.expiresAt,
    })
    if (error) throw error
    if (typeof data !== 'string' || !/^[A-Fa-f0-9]{64}$/.test(data)) {
      throw new Error('The secure share link could not be created.')
    }
    return data
  }

  export async function revokePassportShareLink(linkId: string): Promise<void> {
    const { data, error } = await getClient().rpc('revoke_passport_share_link', { p_link_id: linkId })
    if (error) throw error
    if (data !== true) throw new Error('This share link could not be revoked.')
  }
export async function setPassportSharing(
  userId: string,
  isPublic: boolean,
): Promise<{ is_public: boolean; public_slug: string | null }> {
  const { data, error } = await getClient()
    .from('profiles')
    .update({ is_public: isPublic })
    .eq('id', userId)
    .select('is_public,public_slug')
    .single()

  if (error) throw error
  if (data.is_public && !data.public_slug) {
    throw new Error('The secure public link was not generated. Sharing remains unavailable.')
  }
  return data
}

export async function setPassportEvidenceVisibility(
  userId: string,
  evidenceId: string,
  visibility: 'private' | 'public',
): Promise<void> {
  const { data, error } = await getClient()
    .from('evidence')
    .update({ visibility })
    .eq('id', evidenceId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('This evidence could not be updated in your account.')
}

export async function getPublicPassport(slug: string): Promise<PublicPassport | null> {
  if (!/^[A-Za-z0-9_-]{12,64}$/.test(slug)) return null

  if (/^[A-Fa-f0-9]{64}$/.test(slug)) {
    const { data: shareData, error: shareError } = await getClient().rpc('get_passport_share', {
      p_token: slug,
    })
    if (shareError) throw shareError
    if (shareData !== null) {
      const parsedShare = publicPassportSchema.safeParse(shareData)
      if (!parsedShare.success) throw new Error('The shared passport data could not be safely displayed.')
      return parsedShare.data
    }
  }

  const { data, error } = await getClient().rpc('get_public_passport_v2', {
    p_slug: slug,
  })

  if (error) throw error
  if (data === null) return null

  const parsed = publicPassportSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('The public passport data could not be safely displayed.')
  }
  return parsed.data
}

export async function submitPassportCorrectionRequest(
  slug: string,
  message: string,
  contactEmail: string,
): Promise<void> {
  const isShareToken = /^[A-Fa-f0-9]{64}$/.test(slug)
  const { error } = isShareToken
    ? await getClient().rpc('submit_passport_share_correction', {
        p_token: slug,
        p_message: message,
        p_contact_email: contactEmail || null,
      })
    : await getClient().rpc('submit_passport_correction_request', {
        p_slug: slug,
        p_message: message,
        p_contact_email: contactEmail || null,
      })
  if (error) throw error
}
