import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const maxFileSize = 10 * 1024 * 1024

const fileRules = {
  pdf: {
    mimeType: 'application/pdf',
    matches: (bytes: Uint8Array) =>
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d,
  },
  png: {
    mimeType: 'image/png',
    matches: (bytes: Uint8Array) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  jpg: {
    mimeType: 'image/jpeg',
    matches: (bytes: Uint8Array) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  jpeg: {
    mimeType: 'image/jpeg',
    matches: (bytes: Uint8Array) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
} as const

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return respond(405, { error: 'Use POST to upload an evidence file.' })
  }

  const authorization = request.headers.get('Authorization')
  const bearerMatch = authorization?.match(/^Bearer\s+(.+)$/i)
  const accessToken = bearerMatch?.[1]
  if (!accessToken) {
    return respond(401, { error: 'Sign in before uploading an evidence file.' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const publishableKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return respond(500, { error: 'The secure upload service is not configured.' })
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !userData.user) {
    return respond(401, { error: 'Your session is invalid or expired. Sign in again.' })
  }

  const contentLength = Number(request.headers.get('Content-Length') ?? 0)
  if (contentLength > maxFileSize + 64 * 1024) {
    return respond(413, { error: 'Files must be 10 MB or smaller.' })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return respond(400, { error: 'The upload request is not valid multipart form data.' })
  }

  const file = formData.get('file')
  const evidenceId = formData.get('evidence_id')
  if (!(file instanceof File) || typeof evidenceId !== 'string' || !isValidUuid(evidenceId)) {
    return respond(400, { error: 'A valid evidence ID and file are required.' })
  }
  if (file.size === 0) {
    return respond(400, { error: 'The selected file is empty.' })
  }
  if (file.size > maxFileSize) {
    return respond(413, { error: 'Files must be 10 MB or smaller.' })
  }

  const originalName = file.name.split(/[\\/]/).pop() ?? ''
  const extension = originalName.split('.').pop()?.toLowerCase() ?? ''
  const rule = fileRules[extension as keyof typeof fileRules]
  if (!rule) {
    return respond(415, { error: 'Choose a PDF, PNG or JPEG file.' })
  }
  if (file.type && file.type !== rule.mimeType) {
    return respond(415, { error: 'The file type does not match its extension.' })
  }

  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  if (!rule.matches(signature)) {
    return respond(415, { error: 'The file contents do not match an allowed PDF, PNG or JPEG format.' })
  }

  const safeName =
    originalName
      .replace(/^\.+/, '')
      .replace(/[^A-Za-z0-9._-]/g, '_')
      .slice(-100) || `evidence.${extension}`
  const path = `${userData.user.id}/${evidenceId}/${crypto.randomUUID()}-${safeName}`
  const storageAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: uploadError } = await storageAdmin.storage
    .from('evidence')
    .upload(path, file, {
      contentType: rule.mimeType,
      upsert: false,
    })

  if (uploadError) {
    return respond(400, { error: uploadError.message })
  }

  return respond(200, {
    storage_path: path,
    mime_type: rule.mimeType,
  })
})
