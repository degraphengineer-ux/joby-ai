import { AlertTriangle, CheckCircle2, LoaderCircle, Sparkles } from '../../components/ui/icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback'
import { SelectField } from '../../components/ui/SelectField'
import { useAuth } from '../auth/useAuth'
import { readAiPermissions } from '../ai/aiPermissions'
import { listSkills } from '../skills/skillsService'
import type { Skill } from '../skills/skillSchema'
import {
  generateAiQuiz,
  getAiQuizResult,
  listAiQuizHistory,
  resumeAiQuiz,
  submitAiQuiz,
  type AiQuizHistoryItem,
  type AiQuizQuestion,
  type AiQuizResult,
  type QuizDifficulty,
} from './aiQuizService'

type ActiveQuiz = {
  id: string
  skill_name: string
  difficulty: QuizDifficulty
  questions: AiQuizQuestion[]
}

export function AIQuizSection() {
  const { user } = useAuth()
  const canUseSkillContext = readAiPermissions(user?.user_metadata).quizSkillContext
  const [skills, setSkills] = useState<Skill[]>([])
  const [history, setHistory] = useState<AiQuizHistoryItem[]>([])
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('beginner')
  const [quiz, setQuiz] = useState<ActiveQuiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [result, setResult] = useState<AiQuizResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshHistory = async () => {
    setHistory(await listAiQuizHistory())
  }

  useEffect(() => {
    let active = true
    if (!user) {
      setIsLoading(false)
      return
    }
    Promise.all([listSkills(user.id), listAiQuizHistory()])
      .then(([ownSkills, ownHistory]) => {
        if (!active) return
        setSkills(ownSkills)
        setHistory(ownHistory)
        if (ownSkills[0]) setSelectedSkillId(ownSkills[0].id)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Your quiz data could not be loaded.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const generate = async () => {
    if (!selectedSkillId || !canUseSkillContext) return
    setError(null)
    setIsGenerating(true)
    try {
      const generated = await generateAiQuiz(selectedSkillId, difficulty)
      setQuiz({
        id: generated.quiz_id,
        skill_name: generated.skill_name,
        difficulty: generated.difficulty,
        questions: generated.questions,
      })
      setAnswers({})
      setResult(null)
      await refreshHistory()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The quiz could not be generated.')
    } finally {
      setIsGenerating(false)
    }
  }

  const submit = async () => {
    if (!quiz || quiz.questions.some(({ id }) => !answers[id])) return
    setError(null)
    setIsSubmitting(true)
    try {
      const submitted = await submitAiQuiz(
        quiz.id,
        quiz.questions.map(({ id }) => ({ question_id: id, selected_option: answers[id] })),
      )
      setResult(submitted)
      await refreshHistory()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your quiz answers could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openHistory = async (item: AiQuizHistoryItem) => {
    setError(null)
    setIsSubmitting(true)
    try {
      if (item.status === 'completed') {
        setResult(await getAiQuizResult(item.id))
        setQuiz(null)
      } else {
        const resumed = await resumeAiQuiz(item.id)
        setQuiz({
          id: resumed.quiz_id,
          skill_name: resumed.skill_name,
          difficulty: resumed.difficulty,
          questions: resumed.questions,
        })
        setAnswers({})
        setResult(null)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The quiz result could not be loaded.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <Card className="mb-8 p-5 shadow-card sm:p-6"><LoadingState label="Loading your skills and quiz history..." /></Card>

  return (
    <Card className="mb-8 p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={19} className="text-coral" aria-hidden="true" />
            <h2 className="text-xl font-bold text-navy">Personalized knowledge quizzes</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slatebody">
            Generate five skill-specific questions at a chosen level. Questions, answer keys, scoring, and explanations are validated or calculated server-side; answers stay private to your account.
          </p>
        </div>
      </div>

      {error && <div className="mt-4"><ErrorState>{error}</ErrorState></div>}

      {!skills.length ? (
        <div className="mt-5">
          <EmptyState title="Add a skill before generating a quiz">
            <p>AI quizzes are generated from a skill you have registered.</p>
            <Link to="/skills" className="mt-3 inline-flex font-semibold text-teal-700 underline">Add a skill</Link>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <SelectField
            label="Registered skill"
            value={selectedSkillId}
            onChange={(event) => setSelectedSkillId(event.target.value)}
            disabled={Boolean(quiz)}
          >
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name} · {skill.self_reported_level}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as QuizDifficulty)}
            disabled={Boolean(quiz)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </SelectField>
          <Button
            type="button"
            onClick={() => void generate()}
            disabled={!canUseSkillContext || isGenerating || Boolean(quiz)}
            className="lg:min-w-44"
          >
            {isGenerating ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
            {isGenerating ? 'Generating…' : 'Generate quiz'}
          </Button>
          <p className="text-xs leading-5 text-slatebody sm:col-span-2 lg:col-span-3">
            {canUseSkillContext
              ? <>Your selected skill and self-reported level will be sent to the configured AI provider. Manage this permission in <Link to="/settings" className="font-semibold text-teal-700 underline">Privacy and permissions</Link>.</>
              : <>Enable AI skill-based quizzes in <Link to="/settings" className="font-semibold text-teal-700 underline">Settings → Privacy and permissions</Link> before generating a quiz.</>}
          </p>
        </div>
      )}

      {isGenerating && <div className="mt-4" role="status"><LoadingState label="Creating questions for your selected skill..." /></div>}

      {quiz && !result && (
        <section className="mt-7 border-t border-navy/10 pt-5" aria-labelledby="active-quiz-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 id="active-quiz-heading" className="text-lg font-bold text-navy">{quiz.skill_name} practice quiz</h3>
              <p className="mt-1 text-sm text-slatebody">Choose one answer per question. Correct answers are revealed after submission.</p>
            </div>
            <Badge tone="teal">{quiz.difficulty}</Badge>
          </div>
          <ol className="mt-5 space-y-4">
            {quiz.questions.map((question, index) => (
              <li key={question.id}>
                <fieldset className="rounded-xl border border-navy/10 p-4 sm:p-5">
                  <legend className="px-1 text-sm font-bold leading-6 text-navy">{index + 1}. {question.question}</legend>
                  <div className="mt-2 space-y-2">
                    {question.options.map((option) => (
                      <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 text-sm leading-5 text-slatebody transition hover:border-navy/10 hover:bg-warm has-[:checked]:border-coral/30 has-[:checked]:bg-coral/5 has-[:checked]:text-navy">
                        <input
                          type="radio"
                          name={`${quiz.id}-${question.id}`}
                          value={option.id}
                          checked={answers[question.id] === option.id}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                          disabled={isSubmitting}
                          className="mt-1 accent-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                        />
                        <span><span className="mr-2 font-semibold">{option.id}.</span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            className="mt-5"
            onClick={() => void submit()}
            disabled={isSubmitting || quiz.questions.some(({ id }) => !answers[id])}
          >
            {isSubmitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
            Submit answers
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="ml-2 mt-5"
            onClick={() => {
              setQuiz(null)
              setAnswers({})
              setError(null)
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </section>
      )}

      {result && (
        <section className="mt-7 border-t border-navy/10 pt-5" aria-labelledby="quiz-result-heading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 id="quiz-result-heading" className="text-lg font-bold text-navy">{result.skill_name} quiz result</h3>
              <p className="mt-1 text-sm text-slatebody">
                Your score: <strong className="text-navy">{result.score} / {result.total_questions}</strong>.
                {' '}{result.score < 3
                  ? 'Review the missed-question explanations and practice this skill at a foundational level.'
                  : 'Review any missed-question explanations to identify specific concepts to practice.'}
              </p>
            </div>
            <Badge tone="teal">{result.difficulty}</Badge>
          </div>
          <ol className="mt-5 space-y-3">
            {result.results.map((item, index) => (
              <li key={item.question_id} className={`rounded-xl border p-4 ${item.is_correct ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
                <div className="flex items-start gap-2">
                  {item.is_correct
                    ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                    : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />}
                  <div>
                    <p className="font-semibold leading-6 text-navy">{index + 1}. {item.question}</p>
                    <p className="mt-1 text-sm text-slatebody">
                      Your answer: {item.selected_option} · Correct answer: {item.correct_option}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slatebody">{item.explanation}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setResult(null)
              setQuiz(null)
              setAnswers({})
            }}
          >
            Create another quiz
          </Button>
        </section>
      )}

      <section className="mt-7 border-t border-navy/10 pt-5" aria-labelledby="quiz-history-heading">
        <h3 id="quiz-history-heading" className="font-bold text-navy">Recent quiz history</h3>
        {history.length ? (
          <ul className="mt-3 divide-y divide-navy/10">
            {history.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">{item.skill_name} · {item.difficulty}</p>
                  <p className="mt-1 text-xs text-slatebody">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <Button type="button" variant="ghost" className="min-h-9 px-2" onClick={() => void openHistory(item)} disabled={isSubmitting}>
                  {item.status === 'completed' ? `Review · ${item.score}/${item.total_questions}` : 'Resume quiz'}
                </Button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-slatebody">Your completed practice scores will appear here.</p>}
      </section>
    </Card>
  )
}
