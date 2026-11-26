import CSSMatrix from 'npm:@thednp/dommatrix@3.1.4'

type PdfJsModule = typeof import('npm:pdfjs-dist@5.4.624/legacy/build/pdf.mjs')

let pdfjsModule: PdfJsModule | null = null

export async function getPdfJs() {
  if (typeof Reflect.get(globalThis, 'DOMMatrix') === 'undefined') {
    Object.defineProperty(globalThis, 'DOMMatrix', { value: CSSMatrix })
  }
  pdfjsModule ??= await import('npm:pdfjs-dist@5.4.624/legacy/build/pdf.mjs')
  return pdfjsModule
}
