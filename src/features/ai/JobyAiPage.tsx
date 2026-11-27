import { Attachment, BarChart, CornerDownLeft, LoaderCircle, LayoutLeftFilled, Plus, RefreshFilled, Sketching } from '../../components/ui/icons'
import { lazy, Suspense, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { useAuth } from '../auth/useAuth'
import { readAiPermissions } from './aiPermissions'
import { askJobyAi, type AiChatMessage } from './jobyAiService'
import { normalizePublicAnalysisUrl } from './publicUrl'

const MarkdownMessage = lazy(() => import('./MarkdownMessage').then(({ MarkdownMessage: component }) => ({ default: component })))

const suggestions = [
  {
    label: 'Analyze my project',
    prompt: 'Review my project and suggest the most useful improvements to make next.',
    icon: BarChart,
  },
  {
    label: 'Write or edit',
    prompt: 'Help me write or edit something for my career or project.',
    icon: Sketching,
  },
  {
    label: 'Start a real assessment',
    to: '/assessments',
    icon: RefreshFilled,
  },
]

type AuthenticatedOutletContext = {
  mobileMenuOpen?: boolean
  openMobileMenu?: (trigger: HTMLButtonElement) => void
}

export function JobyAiPage() {
  const { user } = useAuth()
  const outletContext = useOutletContext<AuthenticatedOutletContext>()
  const permissions = readAiPermissions(user?.user_metadata)
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [urlDraft, setUrlDraft] = useState('')
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isUrlInputOpen) urlInputRef.current?.focus()
  }, [isUrlInputOpen])

  const sendMessage = async (event?: FormEvent<HTMLFormElement>, suggestedPrompt?: string) => {
    event?.preventDefault()
    const url = urlDraft.trim() ? normalizePublicAnalysisUrl(urlDraft) : null
    if (urlDraft.trim() && !url) {
      setError('Enter a public HTTPS page URL without credentials or a custom port.')
      return
    }
    if (url && !permissions.publicUrlAnalysis) {
      setError('Enable public page analysis in Settings → Privacy and permissions.')
      return
    }

    const text = (suggestedPrompt ?? draft).trim() || (url
      ? 'Analyze this public page. Summarize its purpose, key content, strengths, and practical improvement opportunities.'
      : '')
    if (!user || (!text && !url) || isSending) return

    const userMessage = url ? `${text}\n\nPage to analyze: ${url}` : text
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(updatedMessages)
    setDraft('')
    setUrlDraft('')
    setIsUrlInputOpen(false)
    setError(null)
    setIsSending(true)
    try {
      const answer = await askJobyAi(updatedMessages, url ?? undefined, permissions.profileContext)
      setMessages((current) => [...current, { role: 'assistant', content: answer }])
      requestAnimationFrame(() => transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' }))
    } catch (cause) {
      setMessages((current) => current.slice(0, -1))
      setDraft(text)
      setUrlDraft(url ?? '')
      setError(cause instanceof Error ? cause.message : 'Joby AI could not respond. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void sendMessage()
    }
  }

  const renderComposer = (compact: boolean) => (
    <form
      className={`w-full ${compact ? 'max-w-5xl' : ''}`}
      onSubmit={(event) => void sendMessage(event)}
    >
      <label htmlFor="joby-ai-message" className="sr-only">Message Joby AI</label>
      <div className={`flex items-center gap-2 rounded-full border border-navy/10 bg-white px-3 py-2 shadow-[0_8px_32px_rgba(27,39,58,0.08)] transition focus-within:border-coral/50 focus-within:ring-4 focus-within:ring-coral/10 sm:px-5 ${compact ? 'min-h-[3.75rem]' : 'min-h-14'}`}>
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slatebody transition hover:bg-warm hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          aria-label={isUrlInputOpen ? 'Close public page URL input' : 'Add a public page to analyze'}
          aria-expanded={isUrlInputOpen}
          onClick={() => setIsUrlInputOpen((open) => !open)}
        >
          <Attachment size={23} aria-hidden="true" />
        </button>
        <textarea
          id="joby-ai-message"
          rows={1}
          maxLength={4000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder="Ask Joby AI"
          className="joby-ai-composer__textarea max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent py-2 text-base text-navy outline-none focus:border-0 focus:outline-none focus:ring-0 placeholder:text-slatebody/70"
          aria-describedby="joby-ai-privacy"
          disabled={isSending}
        />
        <button
          type="submit"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral text-navy transition-colors hover:bg-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSending || (!draft.trim() && !urlDraft.trim())}
          aria-label="Send message"
        >
          {isSending ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : <CornerDownLeft size={23} aria-hidden="true" />}
        </button>
      </div>

      {isUrlInputOpen && (
        <div className="mt-3 text-left">
          <label htmlFor="joby-ai-url" className="sr-only">Public page URL</label>
          <input
            ref={urlInputRef}
            id="joby-ai-url"
            type="url"
            maxLength={2048}
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            placeholder="https://example.com/project"
            disabled={isSending || !permissions.publicUrlAnalysis}
            className="joby-ai-url-input min-h-10 w-full rounded-full border-0 bg-white px-4 py-2 text-sm text-navy shadow-[0_8px_32px_rgba(27,39,58,0.08)] outline-none placeholder:text-slatebody/60 focus:border-0 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-warm"
          />
        </div>
      )}
      {error && <div className="mt-3"><ErrorState>{error}</ErrorState></div>}
      <p id="joby-ai-privacy" className="sr-only">
        Your chat clears when you leave. Don’t share passwords or secrets.
      </p>
    </form>
  )

  return (
    <PageContainer className="py-0">
      <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-6xl flex-col">
        <div className="absolute right-0 top-3 z-10">
          <button
            type="button"
            className="app-mobile-menu"
            aria-label={outletContext?.mobileMenuOpen ? 'Navigation menu open' : 'Open navigation menu'}
            aria-expanded={outletContext?.mobileMenuOpen ?? false}
            aria-controls="app-sidebar"
            onClick={(event) => outletContext?.openMobileMenu?.(event.currentTarget)}
          >
            <LayoutLeftFilled size={20} aria-hidden="true" />
          </button>
        </div>

        {messages.length === 0 ? (
          <section aria-labelledby="joby-ai-heading" className="flex flex-1 flex-col items-center justify-start px-2 pb-12 pt-16 sm:px-6 sm:pb-20">
            <section className="flex w-full max-w-4xl flex-col gap-10">
              <h1 id="joby-ai-heading" className="text-center text-3xl font-medium tracking-tight text-navy sm:text-4xl">
                What will you build next?
              </h1>
              {renderComposer(true)}
              <nav className="space-y-3 pt-2 sm:space-y-4" aria-label="Suggested actions">
                {suggestions.map(({ label, prompt, icon: Icon, to }) => (
                  to ? (
                    <Link
                      key={label}
                      to={to}
                      className="flex min-h-8 w-full items-center gap-4 rounded-md px-4 py-1 text-left text-base font-medium text-slatebody transition hover:bg-white/70 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:px-6"
                    >
                      <Icon size={24} className="shrink-0 text-slatebody" aria-hidden="true" />
                      {label}
                    </Link>
                  ) : (
                    <button
                      key={label}
                      type="button"
                      className="flex min-h-8 w-full items-center gap-4 rounded-md px-4 py-1 text-left text-base font-medium text-slatebody transition hover:bg-white/70 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-not-allowed disabled:opacity-60 sm:px-6"
                      onClick={() => void sendMessage(undefined, prompt)}
                      disabled={isSending}
                    >
                      <Icon size={24} className="shrink-0 text-slatebody" aria-hidden="true" />
                      {label}
                    </button>
                  )
                ))}
              </nav>
            </section>
          </section>
        ) : (
          <section aria-label="Joby AI conversation" className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-end pt-3">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 rounded-xl bg-transparent px-5 text-base text-navy hover:bg-stone/40 focus-visible:outline-coral"
                onClick={() => {
                  setMessages([])
                  setDraft('')
                  setUrlDraft('')
                  setError(null)
                }}
                disabled={isSending}
                aria-label="Clear conversation"
              >
                <Plus size={20} aria-hidden="true" />
                <span>New chat</span>
              </Button>
            </div>
            <div ref={transcriptRef} className="flex-1 space-y-7 overflow-y-auto px-1 pb-8 pt-8 sm:px-10 sm:pt-12" aria-live="polite">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <article className={message.role === 'user'
                    ? 'max-w-[85%] whitespace-pre-wrap rounded-full bg-coral/20 px-6 py-3 text-base leading-7 text-navy sm:max-w-[70%]'
                    : 'w-full max-w-5xl break-words py-2 text-base leading-8 text-navy'}>
                    {message.role === 'assistant'
                      ? (
                        <Suspense fallback={<p className="text-sm text-slatebody" role="status">Formatting response…</p>}>
                          <MarkdownMessage content={message.content} />
                        </Suspense>
                      )
                      : message.content}
                  </article>
                </div>
              ))}
              {isSending && (
                <div className="flex items-center gap-2 text-sm text-slatebody" role="status">
                  <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                  Joby AI is thinking…
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-warm/95 px-1 pb-5 pt-4 backdrop-blur sm:px-8 sm:pb-8">
              <div className="mx-auto max-w-5xl">
                {renderComposer(false)}
              </div>
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  )
}
