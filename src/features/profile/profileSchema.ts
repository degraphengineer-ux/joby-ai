import { z } from 'zod'

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, 'Display name is required.').max(80),
  headline: z.string().trim().max(120, 'Headline must be 120 characters or fewer.'),
  bio: z.string().trim().max(500, 'Bio must be 500 characters or fewer.'),
  location: z.string().trim().max(80, 'Location must be 80 characters or fewer.'),
  target_role: z.string().trim().max(120, 'Target role must be 120 characters or fewer.'),
  years_experience: z
    .number()
    .min(0, 'Years of experience cannot be negative.')
    .max(80, 'Enter a value up to 80 years.')
    .nullable(),
})

export type ProfileInput = z.infer<typeof profileSchema>

export type Profile = ProfileInput & {
  id: string
  avatar_path: string | null
  is_public: boolean
  public_slug: string | null
  created_at: string
  updated_at: string
}

export const emptyProfile = (displayName = ''): ProfileInput => ({
  display_name: displayName,
  headline: '',
  bio: '',
  location: '',
  target_role: '',
  years_experience: null,
})
