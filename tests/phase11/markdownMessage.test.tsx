import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MarkdownMessage } from '../../src/features/ai/MarkdownMessage'

const sampleResponse = `### 1. Semantic HTML & Document Architecture
Go beyond \`div\` and \`span\`. Using the right tags improves accessibility and SEO.

**What to master:**

- Understand when to use \`<header>\`, \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\`, \`<aside>\`, and \`<footer>\`.
- Understand semantic document structure.
**Action step:** Refactor an existing page using meaningful semantic HTML elements.

### 2. Web Accessibility (a11y) and ARIA

1. Semantic HTML.
2. Accessible labels.
   - Keyboard navigation.
   - ARIA attributes.

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

Skill | Importance
--- | ---
HTML | High
CSS | High

> Good developers build interfaces that work for everyone.

---`

describe('Joby AI Markdown message rendering', () => {
  it('renders the complete sample response as structured Markdown', () => {
    const markup = renderToStaticMarkup(<MarkdownMessage content={sampleResponse} />)

    expect(markup).toContain('<h3>1. Semantic HTML &amp; Document Architecture</h3>')
    expect(markup).toContain('<strong>What to master:</strong>')
    expect(markup).toContain('<code>div</code>')
    expect(markup).toContain('<pre><code class="language-js">')
    expect(markup).toContain('<ul>')
    expect(markup).toContain('<ol>')
    expect(markup).toContain('<blockquote>')
    expect(markup).toContain('<hr/>')
    expect(markup).toContain('<div class="joby-ai-markdown__table-wrap"><table>')
    expect(markup).toContain('<th>Skill</th>')
    expect(markup).toContain('<td>HTML</td>')
  })

  it('does not execute raw HTML or unsafe links and opens external links safely', () => {
    const markup = renderToStaticMarkup(
      <MarkdownMessage content={'**Safe** <script>alert(1)</script> [unsafe](javascript:alert(1)) [safe](https://example.com)'} />,
    )

    expect(markup).toContain('<strong>Safe</strong>')
    expect(markup).not.toContain('<script')
    expect(markup).not.toContain('javascript:')
    expect(markup).toContain('href="https://example.com"')
    expect(markup).toContain('rel="noopener noreferrer"')
    expect(markup).toContain('target="_blank"')
  })

  it('renders all heading levels, emphasis, strikethrough, nested lists, and soft line breaks', () => {
    const markup = renderToStaticMarkup(
      <MarkdownMessage content={`# One
## Two
### Three
#### Four
**bold** *italic* ~~removed~~
- parent
  - child
first line
second line`} />,
    )

    expect(markup).toContain('<h1>One</h1>')
    expect(markup).toContain('<h2>Two</h2>')
    expect(markup).toContain('<h3>Three</h3>')
    expect(markup).toContain('<h4>Four</h4>')
    expect(markup).toContain('<strong>bold</strong>')
    expect(markup).toContain('<em>italic</em>')
    expect(markup).toContain('<del>removed</del>')
    expect(markup).toContain('<ul>')
    expect(markup).toContain('<br/>')
  })

  it('re-renders incremental response updates as Markdown', () => {
    const partial = renderToStaticMarkup(<MarkdownMessage content={'**A response is still streaming**'} />)
    const completed = renderToStaticMarkup(<MarkdownMessage content={'**A response is still streaming** and this paragraph continues.'} />)

    expect(partial).toContain('<strong>A response is still streaming</strong>')
    expect(completed).toContain('<strong>A response is still streaming</strong> and this paragraph continues.')
  })
})
