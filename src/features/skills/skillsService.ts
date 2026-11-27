import { supabase } from '../../lib/supabase'
import { ensureProfileExists } from '../profile/profileService'
import type { Skill, SkillInput } from './skillSchema'

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key.')
  }
  return supabase
}

export async function listSkills(userId: string): Promise<Skill[]> {
  const { data, error } = await getClient()
    .from('skills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Skill[]
}

export async function createSkill(
  userId: string,
  input: SkillInput,
  displayName: string,
  source: 'user' | 'ai_suggestion' = 'user',
): Promise<Skill> {
  await ensureProfileExists(userId, displayName)

  const { data, error } = await getClient()
    .from('skills')
    .insert({
      user_id: userId,
      name: input.name,
      category: input.category || null,
      self_reported_level: input.self_reported_level,
      description: input.description || null,
      skill_type: input.skill_type ?? 'hard_skill',
      taxonomy_framework: input.taxonomy_framework || null,
      taxonomy_code: input.taxonomy_code || null,
      source,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Skill
}

export async function updateSkill(
  userId: string,
  skillId: string,
  input: SkillInput,
): Promise<Skill> {
  const { data, error } = await getClient()
    .from('skills')
    .update({
      name: input.name,
      category: input.category || null,
      self_reported_level: input.self_reported_level,
      description: input.description || null,
      skill_type: input.skill_type ?? 'hard_skill',
      taxonomy_framework: input.taxonomy_framework || null,
      taxonomy_code: input.taxonomy_code || null,
    })
    .eq('id', skillId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data as Skill
}

export async function deleteSkill(userId: string, skillId: string): Promise<void> {
  const { data, error } = await getClient()
    .from('skills')
    .delete()
    .eq('id', skillId)
    .eq('user_id', userId)
    .select('id')

  if (error) throw error
  if (!data?.length) throw new Error('This skill could not be found or is no longer available.')
}
