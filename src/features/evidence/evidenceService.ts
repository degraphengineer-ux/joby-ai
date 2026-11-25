import { supabase } from '../../lib/supabase'
import { displayDatabaseError } from '../../lib/displayErrors'
import { listSkills } from '../skills/skillsService'
import { validateEvidenceFile } from './evidenceFileValidation'
import type {
  EvidenceInput,
  EvidenceRecord,
  EvidenceSkillLink,
} from './evidenceSchema'

const evidenceColumns =
  'id,user_id,title,evidence_type,description,source_url,storage_path,mime_type,processing_status,visibility,created_at'
const evidenceBucket = 'evidence'
const signedUrlLifetimeSeconds = 60

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key.')
  }
  return supabase
}

async function validateOwnedSkills(userId: string, skillIds: string[]) {
  const uniqueIds = [...new Set(skillIds)]
  if (uniqueIds.length !== skillIds.length) {
    throw new Error('A skill can only be linked once.')
  }
  if (!uniqueIds.length) return

  const skills = await listSkills(userId)
  const ownedIds = new Set(skills.map((skill) => skill.id))
  if (uniqueIds.some((id) => !ownedIds.has(id))) {
    throw new Error('One or more selected skills are unavailable in your account.')
  }
}

async function uploadPrivateFile(
  userId: string,
  evidenceId: string,
  file: File,
): Promise<{ path: string; mimeType: string }> {
  const client = getClient()
  const validatedFile = await validateEvidenceFile(file)
  const body = new FormData()
  body.append('evidence_id', evidenceId)
  body.append('file', file, validatedFile.safeName)
  const { data, error } = await client.functions.invoke('evidence-upload', { body })

  if (error) {
    const context = 'context' in error ? error.context : null
    if (context instanceof Response) {
      try {
        const responseBody: unknown = await context.clone().json()
        if (
          typeof responseBody === 'object' &&
          responseBody !== null &&
          'error' in responseBody &&
          typeof responseBody.error === 'string'
        ) {
          throw new Error(responseBody.error)
        }
      } catch (cause) {
        if (cause instanceof Error && cause.message !== 'Unexpected end of JSON input') {
          if (cause.message !== error.message) throw cause
        }
      }
    }
    throw error
  }

  if (
    typeof data !== 'object' ||
    data === null ||
    !('storage_path' in data) ||
    typeof data.storage_path !== 'string' ||
    !('mime_type' in data) ||
    typeof data.mime_type !== 'string' ||
    !data.storage_path.startsWith(`${userId}/${evidenceId}/`)
  ) {
    throw new Error('The secure upload service returned an invalid response.')
  }

  return { path: data.storage_path, mimeType: data.mime_type }
}

async function removePrivateFile(path: string) {
  const { error } = await getClient().storage.from(evidenceBucket).remove([path])
  if (error) throw error
}

export async function listEvidence(userId: string): Promise<EvidenceRecord[]> {
  const { data, error } = await getClient()
    .from('evidence')
    .select(evidenceColumns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as EvidenceRecord[]
}

export async function getEvidence(
  userId: string,
  evidenceId: string,
): Promise<EvidenceRecord | null> {
  const { data, error } = await getClient()
    .from('evidence')
    .select(evidenceColumns)
    .eq('id', evidenceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as EvidenceRecord | null
}

export async function getEvidenceSkillLinks(
  userId: string,
  evidenceId: string,
): Promise<EvidenceSkillLink[]> {
  const evidence = await getEvidence(userId, evidenceId)
  if (!evidence) throw new Error('This evidence could not be found in your account.')

  const { data, error } = await getClient()
    .from('skill_evidence')
    .select('skill_id,relationship_note')
    .eq('evidence_id', evidenceId)

  if (error) throw error
  return data as EvidenceSkillLink[]
}

export async function linkSkillToEvidence(
  userId: string,
  skillId: string,
  evidenceId: string,
  relationshipNote: string,
): Promise<void> {
  await validateOwnedSkills(userId, [skillId])
  const evidence = await getEvidence(userId, evidenceId)
  if (!evidence) throw new Error('This evidence could not be found in your account.')

  const { error } = await getClient()
    .from('skill_evidence')
    .insert({
      skill_id: skillId,
      evidence_id: evidenceId,
      relationship_note: relationshipNote || null,
    })

  if (error) throw error
}

async function replaceSkillLinks(
  userId: string,
  evidenceId: string,
  skillIds: string[],
  relationshipNote: string,
) {
  await validateOwnedSkills(userId, skillIds)

  const { data: currentLinks, error: linksError } = await getClient()
    .from('skill_evidence')
    .select('skill_id')
    .eq('evidence_id', evidenceId)

  if (linksError) throw linksError

  const currentIds = new Set((currentLinks ?? []).map((link) => link.skill_id as string))
  const nextIds = new Set(skillIds)
  const additions = skillIds.filter((id) => !currentIds.has(id))
  const removals = [...currentIds].filter((id) => !nextIds.has(id))
  const client = getClient()
  const note = relationshipNote || null

  if (additions.length) {
    const { error } = await client.from('skill_evidence').insert(
      additions.map((skillId) => ({
        evidence_id: evidenceId,
        skill_id: skillId,
        relationship_note: note,
      })),
    )
    if (error) throw error
  }

  if (skillIds.length) {
    const { error } = await client
      .from('skill_evidence')
      .update({ relationship_note: note })
      .eq('evidence_id', evidenceId)
      .in('skill_id', skillIds)
    if (error) throw error
  }

  if (removals.length) {
    const { error } = await client
      .from('skill_evidence')
      .delete()
      .eq('evidence_id', evidenceId)
      .in('skill_id', removals)
    if (error) throw error
  }
}

export async function createEvidence(
  userId: string,
  input: EvidenceInput,
  file?: File,
): Promise<{ evidence: EvidenceRecord; warning?: string }> {
  if (input.evidence_type === 'document' && !file) {
    throw new Error('Choose a PDF or project screenshot to upload.')
  }
  if (input.evidence_type !== 'document' && file) {
    throw new Error('Files can only be attached to document evidence.')
  }

  await validateOwnedSkills(userId, input.skill_ids)
  const client = getClient()
  const evidenceId = crypto.randomUUID()
  const uploaded = file ? await uploadPrivateFile(userId, evidenceId, file) : null
  const { data, error } = await client
    .from('evidence')
    .insert({
      id: evidenceId,
      user_id: userId,
      title: input.title,
      evidence_type: input.evidence_type,
      description: input.description || null,
      source_url: input.source_url || null,
      storage_path: uploaded?.path ?? null,
      mime_type: uploaded?.mimeType ?? null,
      processing_status: 'pending',
      visibility: 'private',
    })
    .select(evidenceColumns)
    .single()

  if (error) {
    if (uploaded) {
      try {
        await removePrivateFile(uploaded.path)
      } catch (cleanupError) {
        throw new Error(
          `${displayDatabaseError(error)} The upload cleanup also failed: ${displayDatabaseError(cleanupError)}`,
        )
      }
    }
    throw error
  }

  const evidence = data as EvidenceRecord
  let warning: string | undefined
  try {
    await replaceSkillLinks(userId, evidence.id, input.skill_ids, input.relationship_note)
  } catch (linkError) {
    warning = `Evidence was saved, but its skill links could not be updated: ${displayDatabaseError(linkError)}`
  }

  return { evidence, warning }
}

export async function updateEvidence(
  userId: string,
  evidenceId: string,
  input: EvidenceInput,
  file?: File,
): Promise<{ evidence: EvidenceRecord; warning?: string }> {
  const existing = await getEvidence(userId, evidenceId)
  if (!existing) throw new Error('This evidence could not be found in your account.')
  if (input.evidence_type === 'document' && !file && !existing.storage_path) {
    throw new Error('Choose a PDF or project screenshot to upload.')
  }
  if (input.evidence_type !== 'document' && file) {
    throw new Error('Files can only be attached to document evidence.')
  }

  await validateOwnedSkills(userId, input.skill_ids)
  const uploaded = file ? await uploadPrivateFile(userId, evidenceId, file) : null
  const nextStoragePath =
    input.evidence_type === 'document'
      ? uploaded?.path ?? existing.storage_path
      : null
  const nextMimeType =
    input.evidence_type === 'document'
      ? uploaded?.mimeType ?? existing.mime_type
      : null
  const { data, error } = await getClient()
    .from('evidence')
    .update({
      title: input.title,
      evidence_type: input.evidence_type,
      description: input.description || null,
      source_url: input.source_url || null,
      storage_path: nextStoragePath,
      mime_type: nextMimeType,
      visibility: 'private',
    })
    .eq('id', evidenceId)
    .eq('user_id', userId)
    .select(evidenceColumns)
    .single()

  if (error) {
    if (uploaded) {
      try {
        await removePrivateFile(uploaded.path)
      } catch (cleanupError) {
        throw new Error(
          `${displayDatabaseError(error)} The replacement upload cleanup also failed: ${displayDatabaseError(cleanupError)}`,
        )
      }
    }
    throw error
  }

  const evidence = data as EvidenceRecord
  const warnings: string[] = []
  if (existing.storage_path && existing.storage_path !== nextStoragePath) {
    try {
      await removePrivateFile(existing.storage_path)
    } catch (cleanupError) {
      warnings.push(`The evidence was updated, but its old private file could not be removed: ${displayDatabaseError(cleanupError)}`)
    }
  }

  try {
    await replaceSkillLinks(userId, evidence.id, input.skill_ids, input.relationship_note)
  } catch (linkError) {
    warnings.push(`The evidence was updated, but its skill links could not be updated: ${displayDatabaseError(linkError)}`)
  }

  return { evidence, warning: warnings.length ? warnings.join(' ') : undefined }
}

export async function deleteEvidence(userId: string, evidenceId: string): Promise<string | undefined> {
  const evidence = await getEvidence(userId, evidenceId)
  if (!evidence) throw new Error('This evidence could not be found in your account.')

  const { data, error } = await getClient()
    .from('evidence')
    .delete()
    .eq('id', evidenceId)
    .eq('user_id', userId)
    .select('id')

  if (error) throw error
  if (!data?.length) throw new Error('The evidence record could not be deleted.')

  if (evidence.storage_path) {
    try {
      await removePrivateFile(evidence.storage_path)
    } catch (cleanupError) {
      return `Evidence metadata and skill links were deleted, but the private file could not be removed from storage: ${displayDatabaseError(cleanupError)}`
    }
  }
}

export async function createEvidenceSignedUrl(
  userId: string,
  evidenceId: string,
): Promise<string> {
  const evidence = await getEvidence(userId, evidenceId)
  if (!evidence?.storage_path) {
    throw new Error('This evidence does not have a private file attached.')
  }

  const { data, error } = await getClient()
    .storage
    .from(evidenceBucket)
    .createSignedUrl(evidence.storage_path, signedUrlLifetimeSeconds, { download: true })

  if (error) throw error
  return data.signedUrl
}
