export const MAX_PDF_BYTES = 10 * 1024 * 1024
export const MAX_PDF_PAGES = 25
export const MAX_EXTRACTED_TEXT_CHARS = 12_000

type PdfTextItem = {
  str?: unknown
  hasEOL?: unknown
}

type PdfPage = {
  getTextContent: () => Promise<{ items: unknown[] }>
}

type PdfDocument = {
  numPages: number
  getPage: (pageNumber: number) => Promise<PdfPage>
}

export type PdfParser = {
  getDocument: (options: {
    data: Uint8Array
    disableFontFace: boolean
    isEvalSupported: boolean
    useWasm: boolean
  }) => { promise: Promise<PdfDocument>; destroy: () => Promise<void> }
}

export type PdfExtractionResult =
  | { ok: true; text: string; pageCount: number }
  | {
      ok: false
      reason: 'invalid_signature' | 'too_many_pages' | 'no_text' | 'unreadable'
    }

export async function extractPdfText(
  bytes: Uint8Array,
  parser: PdfParser,
): Promise<PdfExtractionResult> {
  if (
    bytes.length < 5 ||
    bytes[0] !== 0x25 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x44 ||
    bytes[3] !== 0x46 ||
    bytes[4] !== 0x2d
  ) {
    return { ok: false, reason: 'invalid_signature' }
  }
  if (bytes.length > MAX_PDF_BYTES) {
    return { ok: false, reason: 'unreadable' }
  }

  const task = parser.getDocument({
    data: bytes,
    disableFontFace: true,
    isEvalSupported: false,
    useWasm: false,
  })

  try {
    const document = await task.promise
    if (document.numPages > MAX_PDF_PAGES) {
      return { ok: false, reason: 'too_many_pages' }
    }

    const parts: string[] = []
    let length = 0
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      for (const item of content.items) {
        if (
          typeof item !== 'object' ||
          item === null ||
          !('str' in item)
        ) {
          continue
        }
        const textItem = item as PdfTextItem
        if (typeof textItem.str !== 'string' || !textItem.str) continue
        const separator = textItem.hasEOL === true ? '\n' : ' '
        const remaining = MAX_EXTRACTED_TEXT_CHARS - length
        if (remaining <= 0) break
        const text = `${textItem.str}${separator}`.slice(0, remaining)
        parts.push(text)
        length += text.length
      }
      if (length >= MAX_EXTRACTED_TEXT_CHARS) break
    }

    const text = parts.join('')
      .split(String.fromCharCode(0)).join('')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (text.length < 20) return { ok: false, reason: 'no_text' }
    return { ok: true, text, pageCount: document.numPages }
  } catch {
    return { ok: false, reason: 'unreadable' }
  } finally {
    await task.destroy()
  }
}
