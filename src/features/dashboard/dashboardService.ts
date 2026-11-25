import { supabase } from '../../lib/supabase'
import type { Profile } from '../profile/profileSchema'

export type DashboardActivity = {
  id: string
  label: string
  href: string
  createdAt: string
}

export type DashboardData = {
  profile: Profile | null
  skillCount: number
  evidenceCount: number
  completedAssessmentCount: number
  activities: DashboardActivity[]
}

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key.')
  }
  return supabase
}

function requireCount(count: number | null): number {
  if (count === null) throw new Error('Supabase did not return a record count.')
  return count
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const client = getClient()
  const [
    profileResult,
    skillCountResult,
    evidenceCountResult,
    completedCountResult,
    skillsResult,
    evidenceResult,
    attemptsResult,
  ] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    client.from('skills').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    client.from('evidence').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    client
      .from('assessment_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed'),
    client.from('skills').select('id,name,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    client.from('evidence').select('id,title,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    client.from('assessment_attempts').select('id,status,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
  ])

  const results = [
    profileResult,
    skillCountResult,
    evidenceCountResult,
    completedCountResult,
    skillsResult,
    evidenceResult,
    attemptsResult,
  ]
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error

  const profile = profileResult.data as Profile | null
  const skillCount = requireCount(skillCountResult.count)
  const evidenceCount = requireCount(evidenceCountResult.count)
  const completedAssessmentCount = requireCount(completedCountResult.count)

  const activities: DashboardActivity[] = [
    ...(skillsResult.data ?? []).map((skill) => ({
      id: `skill-${skill.id}`,
      label: `Added skill: ${skill.name}`,
      href: '/skills',
      createdAt: skill.created_at,
    })),
    ...(evidenceResult.data ?? []).map((evidence) => ({
      id: `evidence-${evidence.id}`,
      label: `Added evidence: ${evidence.title}`,
      href: '/evidence',
      createdAt: evidence.created_at,
    })),
    ...(attemptsResult.data ?? []).map((attempt) => ({
      id: `attempt-${attempt.id}`,
      label: attempt.status === 'completed' ? 'Completed an assessment' : 'Started an assessment',
      href: '/assessments',
      createdAt: attempt.created_at,
    })),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6)

  return {
    profile,
    skillCount,
    evidenceCount,
    completedAssessmentCount,
    activities,
  }
}
