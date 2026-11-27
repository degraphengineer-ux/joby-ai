import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

function safeMarkdownUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith('//')) return ''
  if (/^(?:\/|#|\?)/.test(trimmed)) return trimmed
  if (!/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? trimmed : ''
  } catch {
    return ''
  }
}

const markdownComponents: Components = {
  a({ href, children }) {
    const safeHref = href ? safeMarkdownUrl(href) : ''
    const isExternal = /^https?:\/\//i.test(safeHref)
    return safeHref ? (
      <a
        href={safeHref}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ) : <span>{children}</span>
  },
  img({ alt }) {
    return alt ? <span>[Image: {alt}]</span> : null
  },
  table({ children }) {
    return (
      <div className="joby-ai-markdown__table-wrap">
        <table>{children}</table>
      </div>
    )
  },
}

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="joby-ai-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={markdownComponents}
        urlTransform={safeMarkdownUrl}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
