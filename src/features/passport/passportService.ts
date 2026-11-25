import { supabase } from '../../lib/supabase'
import { getProfile } from '../profile/profileService'
import type { Profile } from '../profile/profileSchema'
import { listEvidence } from '../evidence/evidenceService'
import type { EvidenceRecord } from '../evidence/evidenceSchema'
import { listSkills } from '../skills/skillsService'
import type { Skill } from '../skills/skillSchema'
import { assessmentFeedbackSchema } from '../assessments/assessmentSchema'
import {
  publicPassportSchema,
  type PublicPassport,
} from './passportSchema'

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

export type PrivatePassport = {
  profile: Profile
  skills: Skill[]
  evidence: PassportEvidence[]
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

  const [linksResult, reviewsResult, externalCredentialsResult, attemptsResult] = await Promise.all([
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
  ])

  const failed = [linksResult, reviewsResult, externalCredentialsResult, attemptsResult]
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
    assessments,
    invalidAssessmentCount,
    lastUpdatedAt: newestDate(
      [
        profile.updated_at,
        ...skills.map((skill) => skill.updated_at),
        ...evidence.map((item) => item.updated_at),
        ...assessments.map((assessment) => assessment.completed_at),
        ...[...reviewsByEvidence.values()].flat().map((review) => review.reviewed_at),
        ...[...externalCredentialsByEvidence.values()].flat().map((credential) => credential.verified_at),
      ],
      profile.updated_at,
    ),
  }
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
  const { error } = await getClient().rpc('submit_passport_correction_request', {
    p_slug: slug,
    p_message: message,
    p_contact_email: contactEmail || null,
  })
  if (error) throw error
}
