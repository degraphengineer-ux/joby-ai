import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile, ProfileInput } from './profileSchema'

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key.')
  }
  return supabase
}

export function initialProfileName(user: Pick<User, 'user_metadata' | 'email'>): string {
  const metadataName = user.user_metadata?.display_name
  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim().slice(0, 80)
  }

  const emailName = user.email?.split('@')[0].replace(/[._-]+/g, ' ').trim()
  return emailName?.slice(0, 80) || 'Candidate'
}

export async function ensureProfileExists(userId: string, displayName: string): Promise<void> {
  const client = getClient()
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (data) return

  const { error: insertError } = await client
    .from('profiles')
    .upsert(
      { id: userId, display_name: displayName.trim().slice(0, 80) || 'Candidate' },
      { onConflict: 'id', ignoreDuplicates: true },
    )

  if (insertError) throw insertError
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data as Profile | null
}

export async function saveProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const { data, error } = await getClient()
    .from('profiles')
    .upsert(
      {
        id: userId,
        ...input,
        headline: input.headline || null,
        bio: input.bio || null,
        location: input.location || null,
        target_role: input.target_role || null,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return data as Profile
}
