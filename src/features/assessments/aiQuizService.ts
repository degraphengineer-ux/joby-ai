import { z } from 'zod'
import { supabase } from '../../lib/supabase'

const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced'])
const optionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
}).strict()
const questionSchema = z.object({
  id: z.string().regex(/^q[1-5]$/),
  question: z.string().min(1),
  options: z.array(optionSchema).length(4),
}).strict()
const resultQuestionSchema = z.object({
  question_id: z.string().regex(/^q[1-5]$/),
  question: z.string().min(1),
  selected_option: z.enum(['A', 'B', 'C', 'D']),
  correct_option: z.enum(['A', 'B', 'C', 'D']),
  is_correct: z.boolean(),
  explanation: z.string().min(1),
}).strict()

export type QuizDifficulty = z.infer<typeof difficultySchema>
export type AiQuizQuestion = z.infer<typeof questionSchema>
export type AiQuizResult = {
  quiz_id: string
  skill_name: string
  difficulty: QuizDifficulty
  score: number
  total_questions: number
  results: z.infer<typeof resultQuestionSchema>[]
}
export type AiQuizHistoryItem = {
  id: string
  skill_name: string
  difficulty: QuizDifficulty
  score: number | null
  total_questions: number
  status: 'started' | 'completed'
  created_at: string
  submitted_at: string | null
}

async function request(action: Record<string, unknown>) {
  if (!supabase) throw new Error('AI quizzes require a configured Supabase project.')
  const { data, error } = await supabase.functions.invoke('ai-quiz', { body: action })
  if (error) {
    const context = 'context' in error ? error.context : null
    if (context instanceof Response) {
      let payload: unknown
      try {
        payload = await context.clone().json()
      } catch {
        payload = null
      }
      if (typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string') {
        throw new Error(payload.error)
      }
    }
    throw new Error(error.message || 'The AI quiz service could not be reached.')
  }
  return data as unknown
}

export async function generateAiQuiz(skillId: string, difficulty: QuizDifficulty) {
  const data = await request({
    action: 'generate',
    skill_id: skillId,
    difficulty,
    consent_to_ai_processing: true,
  })
  const schema = z.object({
    quiz_id: z.string().uuid(),
    skill_name: z.string().min(1),
    difficulty: difficultySchema,
    questions: z.array(questionSchema).length(5),
  }).strict()
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new Error('The quiz service returned an invalid question set.')
  return parsed.data
}

export async function resumeAiQuiz(quizId: string) {
  const data = await request({ action: 'resume', quiz_id: quizId })
  const schema = z.object({
    quiz_id: z.string().uuid(),
    skill_name: z.string().min(1),
    difficulty: difficultySchema,
    questions: z.array(questionSchema).length(5),
  }).strict()
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new Error('The saved quiz returned invalid question data.')
  return parsed.data
}

export async function submitAiQuiz(
  quizId: string,
  answers: { question_id: string; selected_option: 'A' | 'B' | 'C' | 'D' }[],
): Promise<AiQuizResult> {
  const data = await request({ action: 'submit', quiz_id: quizId, answers })
  return parseAiQuizResult(data)
}

export async function getAiQuizResult(quizId: string): Promise<AiQuizResult> {
  const data = await request({ action: 'review', quiz_id: quizId })
  return parseAiQuizResult(data)
}

function parseAiQuizResult(data: unknown): AiQuizResult {
  const schema = z.object({
    quiz_id: z.string().uuid(),
    skill_name: z.string().min(1),
    difficulty: difficultySchema,
    score: z.number().int().min(0).max(5),
    total_questions: z.literal(5),
    results: z.array(resultQuestionSchema).length(5),
  }).strict()
  const parsed = schema.safeParse(data)
  if (!parsed.success || parsed.data.results.filter(({ is_correct }) => is_correct).length !== parsed.data.score) {
    throw new Error('The quiz service returned an invalid result.')
  }
  return parsed.data
}

export async function listAiQuizHistory(): Promise<AiQuizHistoryItem[]> {
  const data = await request({ action: 'history' })
  const schema = z.object({
    history: z.array(z.object({
      id: z.string().uuid(),
      skill_name: z.string().min(1),
      difficulty: difficultySchema,
      score: z.number().int().nullable(),
      total_questions: z.literal(5),
      status: z.enum(['started', 'completed']),
      created_at: z.string(),
      submitted_at: z.string().nullable(),
    }).strict()).max(20),
  }).strict()
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new Error('Your quiz history returned an invalid response.')
  return parsed.data.history
}
