import { supabase } from '../../lib/supabase'
import { ensureProfileExists } from '../profile/profileService'
import {
  assessmentAttemptSchema,
  assessmentSchema,
  assessmentSubmissionSchema,
  type Assessment,
  type AssessmentAttempt,
  type AssessmentSubmission,
} from './assessmentSchema'

const assessmentColumns =
  'id,title,category,description,instructions,expected_deliverable,rubric,difficulty,is_active'
const attemptColumns =
  'id,assessment_id,user_id,submission_text,submission_url,status,total_score,feedback,assessment_method,submitted_at,completed_at,processing_started_at,ai_skill_context_consent,created_at'

export class AssessmentEvaluationError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = 'AssessmentEvaluationError'
  }
}

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key.')
  }
  return supabase
}

function parseAssessment(value: unknown): Assessment {
  const parsed = assessmentSchema.safeParse(value)
  if (!parsed.success) throw new Error('The assessment definition is incomplete or invalid.')
  return parsed.data
}

function parseAttempt(value: unknown): AssessmentAttempt {
  const parsed = assessmentAttemptSchema.safeParse(value)
  if (!parsed.success) throw new Error('The assessment attempt returned an invalid record.')
  return parsed.data
}

export async function listActiveAssessments(): Promise<Assessment[]> {
  const { data, error } = await getClient()
    .from('assessments')
    .select(assessmentColumns)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(parseAssessment)
}

export async function getActiveAssessment(assessmentId: string): Promise<Assessment | null> {
  const { data, error } = await getClient()
    .from('assessments')
    .select(assessmentColumns)
    .eq('id', assessmentId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data ? parseAssessment(data) : null
}

export async function startAssessment(
  userId: string,
  assessmentId: string,
  displayName: string,
): Promise<AssessmentAttempt> {
  await ensureProfileExists(userId, displayName)

  const { data, error } = await getClient()
    .from('assessment_attempts')
    .insert({ assessment_id: assessmentId, user_id: userId })
    .select(attemptColumns)
    .single()

  if (error) throw error
  return parseAttempt(data)
}

export async function getOwnAttempt(
  userId: string,
  attemptId: string,
): Promise<AssessmentAttempt | null> {
  const { data, error } = await getClient()
    .from('assessment_attempts')
    .select(attemptColumns)
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? parseAttempt(data) : null
}

export async function saveAssessmentSubmission(
  userId: string,
  attemptId: string,
  input: AssessmentSubmission,
  includeSkillContext: boolean,
): Promise<AssessmentAttempt> {
  const parsed = assessmentSubmissionSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Review your submission and try again.')
  }

  const { data, error } = await getClient()
    .from('assessment_attempts')
    .update({
      submission_text: parsed.data.submission_text,
      submission_url: parsed.data.submission_url || null,
      ai_skill_context_consent: includeSkillContext,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('user_id', userId)
    .in('status', ['started', 'submitted', 'failed'])
    .is('total_score', null)
    .is('feedback', null)
    .is('completed_at', null)
    .is('processing_started_at', null)
    .select(attemptColumns)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error('This attempt is no longer editable. Refresh the assessment results to check its status.')
  }
  return parseAttempt(data)
}

export async function requestAssessmentEvaluation(attemptId: string): Promise<void> {
  const { data, error } = await getClient().functions.invoke('assess-submission', {
    body: { attempt_id: attemptId },
  })

  if (error) {
    const context = 'context' in error ? error.context : null
    if (context instanceof Response) {
      let retryAfterSeconds = Number(context.headers.get('Retry-After')) || undefined
      let responseBody: unknown
      try {
        responseBody = await context.clone().json()
      } catch {
        responseBody = null
      }

      let message: string | undefined
      if (typeof responseBody === 'object' && responseBody !== null) {
        if ('error' in responseBody && typeof responseBody.error === 'string') {
          message = responseBody.error
        }
        if (
          !retryAfterSeconds &&
          'retry_after_seconds' in responseBody &&
          typeof responseBody.retry_after_seconds === 'number'
        ) {
          retryAfterSeconds = responseBody.retry_after_seconds
        }
      }

      throw new AssessmentEvaluationError(
        message ?? (context.status === 429
          ? 'The assessment request limit has been reached. Wait before retrying.'
          : 'The assessment could not be completed. Your submission is saved; please retry.'),
        context.status,
        retryAfterSeconds,
      )
    }

    throw new AssessmentEvaluationError(
      error.message || 'The assessment service could not be reached. Your submission is saved; please retry.',
    )
  }

  if (typeof data !== 'object' || data === null || !('status' in data) || data.status !== 'completed') {
    throw new AssessmentEvaluationError('The assessment service returned an invalid response. Your submission is saved; please retry.', 502)
  }
}
