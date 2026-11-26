import { jsPDF } from 'jspdf'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it, vi } from 'vitest'
import {
  extractPdfText,
  MAX_PDF_BYTES,
  MAX_PDF_PAGES,
} from '../../supabase/functions/_shared/pdfTextExtractor'

describe('secure PDF text extraction', () => {
  it('extracts selectable PDF text without persisting or expanding the source', async () => {
    const pdf = new jsPDF()
    pdf.text('Built responsive layouts and documented accessibility checks.', 15, 20)
    const bytes = new Uint8Array(pdf.output('arraybuffer'))

    const result = await extractPdfText(bytes, pdfjs)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.text).toContain('responsive layouts')
      expect(result.pageCount).toBe(1)
      expect(result.text.length).toBeLessThanOrEqual(12_000)
    }
  })

  it('rejects non-PDF content before invoking the parser', async () => {
    let parserCalled = false
    const result = await extractPdfText(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]),
      {
        getDocument: () => {
          parserCalled = true
          throw new Error('Parser should not run')
        },
      },
    )

    expect(result).toEqual({ ok: false, reason: 'invalid_signature' })
    expect(parserCalled).toBe(false)
  })

  it('rejects oversized PDFs before invoking the parser', async () => {
    const bytes = new Uint8Array(MAX_PDF_BYTES + 1)
    bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d])
    let parserCalled = false

    const result = await extractPdfText(bytes, {
      getDocument: () => {
        parserCalled = true
        throw new Error('Parser should not run')
      },
    })

    expect(result).toEqual({ ok: false, reason: 'unreadable' })
    expect(parserCalled).toBe(false)
  })

  it('rejects PDFs beyond the page limit and destroys the parser task', async () => {
    const destroy = vi.fn(async () => {})
    const getPage = vi.fn()
    const result = await extractPdfText(
      new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      {
        getDocument: () => ({
          promise: Promise.resolve({ numPages: MAX_PDF_PAGES + 1, getPage }),
          destroy,
        }),
      },
    )

    expect(result).toEqual({ ok: false, reason: 'too_many_pages' })
    expect(getPage).not.toHaveBeenCalled()
    expect(destroy).toHaveBeenCalledOnce()
  })

  it('reports PDFs without selectable text as insufficient evidence', async () => {
    const pdf = new jsPDF()
    pdf.rect(15, 20, 20, 20)

    const result = await extractPdfText(
      new Uint8Array(pdf.output('arraybuffer')),
      pdfjs,
    )

    expect(result).toEqual({ ok: false, reason: 'no_text' })
  })
})
