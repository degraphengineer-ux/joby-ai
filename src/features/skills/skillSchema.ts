import { z } from 'zod'

export const proficiencyLevels = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'unsure',
] as const

export const proficiencyLabels: Record<(typeof proficiencyLevels)[number], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
  unsure: 'Not sure',
}

export const skillTypes = ['hard_skill', 'soft_skill', 'language', 'micro_credential'] as const
export const skillTypeLabels: Record<(typeof skillTypes)[number], string> = {
  hard_skill: 'Hard skill',
  soft_skill: 'Soft skill',
  language: 'Language',
  micro_credential: 'Micro-credential',
}

export const skillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required.').max(80),
  category: z.string().trim().max(60, 'Category must be 60 characters or fewer.'),
  self_reported_level: z.enum(proficiencyLevels),
  description: z.string().trim().max(400, 'Description must be 400 characters or fewer.'),
  skill_type: z.enum(skillTypes).default('hard_skill'),
  taxonomy_framework: z.string().trim().max(40).default(''),
  taxonomy_code: z.string().trim().max(100).default(''),
}).superRefine((skill, context) => {
  if (Boolean(skill.taxonomy_framework) !== Boolean(skill.taxonomy_code)) {
    context.addIssue({ code: 'custom', path: ['taxonomy_code'], message: 'Provide both a taxonomy framework and code.' })
  }
})

export type SkillInput = z.input<typeof skillSchema>

export type Skill = Omit<z.output<typeof skillSchema>, 'taxonomy_framework' | 'taxonomy_code'> & {
  id: string
  user_id: string
  taxonomy_framework: string | null
  taxonomy_code: string | null
  verified_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
  verified_at?: string | null
  verified_by_credential_id?: string | null
  source: 'user' | 'ai_suggestion' | 'import'
  created_at: string
  updated_at: string
}

export const emptySkill = (): SkillInput => ({
  name: '',
  category: '',
  self_reported_level: 'unsure',
  description: '',
  skill_type: 'hard_skill',
  taxonomy_framework: '',
  taxonomy_code: '',
})
