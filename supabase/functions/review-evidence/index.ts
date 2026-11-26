import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@4.6.7'
import { parsePublicGitHubRepositoryUrl } from '../_shared/githubRepository.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const maxBodyBytes = 8 * 1024
const reviewedMaterialSchema = z.enum(['description', 'source_url', 'private_file'])

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }).strict(),
  z.object({
    action: z.literal('record'),
    evidence_id: z.string().uuid(),
    decision: z.enum(['accepted', 'needs_changes', 'rejected']),
    notes: z.string().trim().max(1000),
    reviewed_material: z.array(reviewedMaterialSchema).min(1).max(3),
  }).strict(),
])

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function readJsonBody(request: Request): Promise<
  { ok: true; value: unknown } | { ok: false; status: number; message: string }
> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return { ok: false, status: 415, message: 'Send the reviewer request as application/json.' }
  }
  const contentLength = Number(request.headers.get('Content-Length') ?? 0)
  if (contentLength > maxBodyBytes) {
    return { ok: false, status: 413, message: 'The reviewer request is too large.' }
  }
  if (!request.body) {
    return { ok: false, status: 400, message: 'A JSON request body is required.' }
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBodyBytes) {
      await reader.cancel()
      return { ok: false, status: 413, message: 'The reviewer request is too large.' }
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) }
  } catch {
    return { ok: false, status: 400, message: 'The reviewer request must contain valid JSON.' }
  }
}

function availableMaterials(evidence: {
  evidence_type?: string
  description: string | null
  source_url: string | null
  storage_path: string | null
}) {
  let hasSafeSourceUrl = false
  if (evidence.source_url) {
    try {
      const url = new URL(evidence.source_url)
      hasSafeSourceUrl = evidence.evidence_type === 'github_url'
        ? Boolean(parsePublicGitHubRepositoryUrl(evidence.source_url))
        : url.protocol === 'https:' && !url.username && !url.password
    } catch {
      hasSafeSourceUrl = false
    }
  }
  return [
    ...(evidence.description?.trim() ? ['description'] : []),
    ...(hasSafeSourceUrl ? ['source_url'] : []),
    ...(evidence.storage_path ? ['private_file'] : []),
  ]
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return respond(405, { error: 'Use POST for reviewer actions.' })

  const accessToken = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!accessToken) return respond(401, { error: 'Sign in with an authorized reviewer account.' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const publishableKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return respond(503, { error: 'The reviewer service is not configured.' })
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: userData, error: authError } = await userClient.auth.getUser(accessToken)
  if (authError || !userData.user) {
    return respond(401, { error: 'Your session is invalid or expired. Sign in again.' })
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: reviewer, error: reviewerError } = await serviceClient
    .from('authorized_reviewers')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (reviewerError) return respond(503, { error: 'Reviewer authorization could not be checked.' })
  if (!reviewer) return respond(403, { error: 'This account is not authorized to review evidence.' })

  const bodyResult = await readJsonBody(request)
  if (!bodyResult.ok) return respond(bodyResult.status, { error: bodyResult.message })
  const parsedRequest = requestSchema.safeParse(bodyResult.value)
  if (!parsedRequest.success) return respond(400, { error: 'The reviewer action is invalid.' })

  if (parsedRequest.data.action === 'list') {
    const { data: evidenceRows, error: evidenceError } = await serviceClient
      .from('evidence')
      .select('id,user_id,title,evidence_type,description,source_url,storage_path,created_at')
      .eq('reviewer_consent', true)
      .order('created_at', { ascending: false })
      .limit(100)
    if (evidenceError) return respond(503, { error: 'The consented evidence queue could not be loaded.' })

    const evidenceIds = (evidenceRows ?? []).map((item) => item.id)
    if (!evidenceIds.length) return respond(200, { evidence: [] })

    const { data: reviewedRows, error: reviewsError } = await serviceClient
      .from('review_records')
      .select('evidence_id')
      .eq('reviewer_id', userData.user.id)
      .in('evidence_id', evidenceIds)
    if (reviewsError) return respond(503, { error: 'Your prior reviews could not be loaded.' })
    const alreadyReviewed = new Set((reviewedRows ?? []).map((row) => row.evidence_id))

    const evidence = []
    for (const item of evidenceRows ?? []) {
      if (alreadyReviewed.has(item.id)) continue
      const materialOptions = availableMaterials(item)
      let privateFileUrl: string | null = null
      let privateFileError: string | null = null
      if (item.storage_path) {
        if (!item.storage_path.startsWith(`${item.user_id}/${item.id}/`)) {
          privateFileError = 'The private file path could not be safely verified.'
        } else {
          const { data: signedFile, error: signedFileError } = await serviceClient.storage
            .from('evidence')
            .createSignedUrl(item.storage_path, 60, { download: true })
          if (signedFileError) {
            privateFileError = 'The private file link could not be generated. Refresh to retry.'
          } else {
            privateFileUrl = signedFile.signedUrl
          }
        }
      }

      const reviewableMaterials = materialOptions.filter((material) =>
        material !== 'private_file' || privateFileUrl !== null
      )
      if (!reviewableMaterials.length && !privateFileError) continue
      evidence.push({
        id: item.id,
        title: item.title,
        evidence_type: item.evidence_type,
        description: item.description,
        source_url: reviewableMaterials.includes('source_url') ? item.source_url : null,
        private_file_url: privateFileUrl,
        private_file_error: privateFileError,
        reviewable_materials: reviewableMaterials,
        submitted_at: item.created_at,
      })
    }
    return respond(200, { evidence })
  }

  const { data: evidence, error: evidenceError } = await serviceClient
    .from('evidence')
    .select('id,user_id,evidence_type,description,source_url,storage_path,reviewer_consent')
    .eq('id', parsedRequest.data.evidence_id)
    .maybeSingle()
  if (evidenceError) return respond(503, { error: 'The evidence could not be loaded for review.' })
  if (!evidence || !evidence.reviewer_consent) {
    return respond(404, { error: 'That evidence is unavailable or no longer consented for review.' })
  }

  const available = new Set(availableMaterials(evidence))
  const selected = parsedRequest.data.reviewed_material
  if (
    new Set(selected).size !== selected.length ||
    selected.some((material) => !available.has(material))
  ) {
    return respond(400, { error: 'Select only evidence material that is available to review.' })
  }
  if (
    selected.includes('private_file') &&
    !evidence.storage_path?.startsWith(`${evidence.user_id}/${evidence.id}/`)
  ) {
    return respond(400, { error: 'The private file path is invalid and cannot be reviewed.' })
  }

  const { data: reviews, error: reviewError } = await serviceClient.rpc(
    'record_evidence_review',
    {
      p_reviewer_id: userData.user.id,
      p_evidence_id: evidence.id,
      p_decision: parsedRequest.data.decision,
      p_notes: parsedRequest.data.notes,
      p_reviewed_material: selected,
    },
  )
  if (reviewError?.code === '23505') {
    return respond(409, { error: 'You have already recorded a review for this evidence.' })
  }
  if (reviewError?.code === '42501') {
    return respond(403, { error: 'This account is no longer authorized to review evidence.' })
  }
  if (reviewError?.code === 'P0002') {
    return respond(404, { error: 'That evidence is unavailable or no longer consented for review.' })
  }
  if (reviewError?.code === '22023') {
    return respond(400, { error: 'The selected review materials are no longer available.' })
  }
  if (reviewError || !Array.isArray(reviews) || reviews.length !== 1) {
    return respond(503, { error: 'The review decision could not be recorded. Please retry.' })
  }

  return respond(200, { review: reviews[0] })
})
