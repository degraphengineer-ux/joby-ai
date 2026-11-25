import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.')
    .max(254, 'Email is too long.')
    .transform((value) => value.toLowerCase())
    .refine((value) => value.length <= 254, 'Email is too long.')
    .refine((value) => !value.includes('..'), 'Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be 128 characters or fewer.')
})

export const registrationSchema = loginSchema
