import { LoaderCircle, Send, Sparkles, Trash2 } from '../../components/ui/icons'
import { useRef, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { useAuth } from '../auth/useAuth'
import { askJobyAi, type AiChatMessage } from './jobyAiService'

const suggestions = [
  'Suggest a practical project based on my skills',
  'Help me build a learning roadmap',
  'Quiz me on a technology I want to improve',
]

export function JobyAiPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [includeProfileContext, setIncludeProfileContext] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  const sendMessage = async (event?: FormEvent<HTMLFormElement>, suggestedPrompt?: string) => {
    event?.preventDefault()
    const text = (suggestedPrompt ?? draft).trim()
    if (!user || !text || isSending) return

    const updatedMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(updatedMessages)
    setDraft('')
    setError(null)
    setIsSending(true)
    try {
      const answer = await askJobyAi(updatedMessages, includeProfileContext)
      setMessages((current) => [...current, { role: 'assistant', content: answer }])
      requestAnimationFrame(() => transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' }))
    } catch (cause) {
      setMessages((current) => current.slice(0, -1))
      setDraft(text)
      setError(cause instanceof Error ? cause.message : 'Joby AI could not respond. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <PageContainer className="py-8 sm:py-12">
      <PageHeading
        title="Joby AI"
        description="A career and skill-development advisor for project ideas, learning plans, quizzes, and feedback on text you choose to share."
      />
      <Card className="mx-auto flex min-h-[min(70vh,48rem)] max-w-4xl flex-col overflow-hidden shadow-card">
        <div className="flex items-center justify-between gap-4 border-b border-navy/10 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral/10 text-coral">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-bold text-navy">Personal AI assistant</h2>
              <p className="text-xs text-slatebody">Replies are AI-generated and may need verification.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="shrink-0"
            onClick={() => {
              setMessages([])
              setError(null)
            }}
            disabled={isSending || messages.length === 0}
            aria-label="Clear conversation"
          >
            <Trash2 size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>

        <div ref={transcriptRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-xl py-8 text-center">
              <h3 className="text-lg font-bold text-navy">What would you like to work on?</h3>
              <p className="mt-2 text-sm leading-6 text-slatebody">
                Ask for project ideas, a step-by-step roadmap, targeted practice questions, or feedback on a project description or code snippet.
              </p>
              <div className="mt-6 grid gap-2 text-left sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-xl border border-navy/10 bg-white p-3 text-sm font-medium leading-5 text-navy transition hover:border-coral/50 hover:bg-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                    onClick={() => void sendMessage(undefined, suggestion)}
                    disabled={isSending}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <article className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${message.role === 'user' ? 'bg-navy text-white' : 'border border-navy/10 bg-warm text-navy'}`}>
                <p className="mb-1 text-[0.6875rem] font-bold uppercase tracking-wide opacity-70">
                  {message.role === 'user' ? 'You' : 'Joby AI'}
                </p>
                {message.content}
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

        {error && <div className="px-4 sm:px-6"><ErrorState>{error}</ErrorState></div>}
        <form className="border-t border-navy/10 bg-white p-4 sm:p-6" onSubmit={(event) => void sendMessage(event)}>
          <label htmlFor="joby-ai-message" className="sr-only">Message Joby AI</label>
          <div className="flex items-end gap-2 rounded-2xl border border-navy/15 bg-white p-2 focus-within:border-coral focus-within:ring-4 focus-within:ring-coral/10">
            <textarea
              id="joby-ai-message"
              rows={2}
              maxLength={4000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a question or describe what you're building…"
              className="max-h-40 min-h-12 flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm text-navy outline-none placeholder:text-slatebody/60"
              aria-describedby="joby-ai-privacy"
              disabled={isSending}
            />
            <Button type="submit" className="mb-1 h-10 min-h-10 w-10 shrink-0 rounded-xl px-0" disabled={isSending || !draft.trim()} aria-label="Send message">
              {isSending ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            </Button>
          </div>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-5 text-slatebody">
            <input
              type="checkbox"
              className="mt-1 accent-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              checked={includeProfileContext}
              onChange={(event) => setIncludeProfileContext(event.target.checked)}
              disabled={isSending}
            />
            <span>Allow Joby AI to use my profile role and registered skills for this conversation. Your profile context is sent with messages only while enabled; messages aren’t saved by Joby AI.</span>
          </label>
          <p id="joby-ai-privacy" className="mt-2 text-[0.6875rem] leading-5 text-slatebody">
            Don’t include passwords, secrets, or sensitive personal information. Only text is supported; pasted project descriptions and code are sent to the configured AI provider when you send a message. Conversation history stays in this page and clears when you leave it or select Clear.
          </p>
        </form>
      </Card>
    </PageContainer>
  )
}
