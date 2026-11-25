const MAX_FILE_SIZE = 10 * 1024 * 1024

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

export type ValidatedEvidenceFile = {
  mimeType: string
  safeName: string
}

export async function validateEvidenceFile(file: File): Promise<ValidatedEvidenceFile> {
  if (file.size === 0) throw new Error('The selected file is empty.')
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Files must be 10 MB or smaller.')
  }

  const rawName = file.name.split(/[\\/]/).pop() ?? ''
  const extension = rawName.split('.').pop()?.toLowerCase() ?? ''
  const rule = fileRules[extension as keyof typeof fileRules]

  if (!rule) {
    throw new Error('Choose a PDF, PNG or JPEG file.')
  }

  if (file.type && file.type !== rule.mimeType) {
    throw new Error('The file type does not match its extension.')
  }

  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  if (!rule.matches(signature)) {
    throw new Error('The file contents do not match an allowed PDF, PNG or JPEG format.')
  }

  const safeName =
    rawName
      .replace(/^\.+/, '')
      .replace(/[^A-Za-z0-9._-]/g, '_')
      .slice(-100) || `evidence.${extension}`

  return { mimeType: rule.mimeType, safeName }
}
