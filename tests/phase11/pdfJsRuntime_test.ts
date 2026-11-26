import { jsPDF } from 'npm:jspdf@4.2.1'
import { extractPdfText } from '../../supabase/functions/_shared/pdfTextExtractor.ts'
import { getPdfJs } from '../../supabase/functions/_shared/pdfJsRuntime.ts'

Deno.test('PDF.js loads and extracts text in the Supabase Deno runtime without DOMMatrix', async () => {
  Reflect.deleteProperty(globalThis, 'DOMMatrix')
  const pdfjs = await getPdfJs()
  const pdf = new jsPDF()
  pdf.text('Built responsive layouts and documented accessibility checks.', 15, 20)
  const bytes = new Uint8Array(pdf.output('arraybuffer'))
  const result = await extractPdfText(bytes, pdfjs)

  if (!result.ok || !result.text.includes('responsive layouts')) {
    throw new Error('PDF.js did not extract selectable text in the Deno runtime.')
  }
})
