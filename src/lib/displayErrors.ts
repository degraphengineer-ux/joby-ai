type ErrorRecord = Record<string, unknown>

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === 'object' && value !== null
}

function stringField(record: ErrorRecord | null, field: string): string {
  const value = record?.[field]
  return typeof value === 'string' ? value.trim() : ''
}

export function displayDatabaseError(error: unknown): string {
  const record = isRecord(error) ? error : null
  const nestedError = isRecord(record?.error) ? record.error : null
  const message =
    (error instanceof Error ? error.message : '') ||
    stringField(record, 'message') ||
    stringField(nestedError, 'message') ||
    stringField(record, 'error_description')
  const code = stringField(record, 'code') || stringField(nestedError, 'code')
  const details = stringField(record, 'details') || stringField(nestedError, 'details')
  const hint = stringField(record, 'hint') || stringField(nestedError, 'hint')
  const normalized = `${message} ${details}`.toLowerCase()

  if (
    ['PGRST205', 'PGRST204', '42P01', '42703'].includes(code) ||
    (normalized.includes('relation') && normalized.includes('does not exist')) ||
    normalized.includes('schema cache') ||
    normalized.includes('could not find the table') ||
    normalized.includes('could not find the column')
  ) {
    return 'The Supabase database schema is missing or out of date. Apply the project migrations with `npx supabase db push`, then reload the app.'
  }

  if (
    code === '42501' ||
    normalized.includes('row-level security') ||
    normalized.includes('permission denied')
  ) {
    return 'Supabase denied this request. Confirm the migrations are applied, you are signed in, and the row-ownership policies are enabled.'
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('network request failed')
  ) {
    return 'Could not reach Supabase. Check your internet connection and the VITE_SUPABASE_URL in .env.local.'
  }

  const diagnostic = [
    message,
    code ? `Code: ${code}` : '',
    details ? `Details: ${details}` : '',
    hint ? `Hint: ${hint}` : '',
  ].filter(Boolean).join(' — ')

  return diagnostic || 'Supabase returned an error without details. Check the browser console and Supabase project logs.'
}
