import { z } from 'zod'

export const proficiencyLevels = [
  'beginner',
  'intermediate',
  'advanced',
  'unsure',
] as const

export const proficiencyLabels: Record<(typeof proficiencyLevels)[number], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  unsure: 'Not sure',
}

export const skillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required.').max(80),
  category: z.string().trim().max(60, 'Category must be 60 characters or fewer.'),
  self_reported_level: z.enum(proficiencyLevels),
  description: z.string().trim().max(400, 'Description must be 400 characters or fewer.'),
})

export type SkillInput = z.infer<typeof skillSchema>

export type Skill = SkillInput & {
  id: string
  user_id: string
  source: 'user' | 'ai_suggestion' | 'import'
  created_at: string
  updated_at: string
}

export const emptySkill = (): SkillInput => ({
  name: '',
  category: '',
  self_reported_level: 'unsure',
  description: '',
})
