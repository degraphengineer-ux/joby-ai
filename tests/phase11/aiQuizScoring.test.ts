import { describe, expect, it } from 'vitest'
import { scoreQuiz, type QuizQuestionForScoring } from '../../supabase/functions/ai-quiz/quizScoring'

const questions: QuizQuestionForScoring[] = Array.from({ length: 5 }, (_, index) => ({
  id: `q${index + 1}`,
  question: `Question ${index + 1}`,
  correct_option: 'A',
  explanation: 'A is correct because it matches the stated concept.',
}))

describe('server-side AI quiz scoring', () => {
  it('calculates the score from the stored answer key', () => {
    const result = scoreQuiz(questions, [
      { question_id: 'q1', selected_option: 'A' },
      { question_id: 'q2', selected_option: 'B' },
      { question_id: 'q3', selected_option: 'A' },
      { question_id: 'q4', selected_option: 'C' },
      { question_id: 'q5', selected_option: 'A' },
    ])

    expect(result).toMatchObject({ ok: true, score: 3 })
    if (result.ok) {
      expect(result.results.filter(({ is_correct }) => is_correct)).toHaveLength(3)
      expect(result.results[1]).toMatchObject({ selected_option: 'B', correct_option: 'A', is_correct: false })
    }
  })

  it('rejects duplicate or missing question answers', () => {
    const invalid = scoreQuiz(questions, [
      { question_id: 'q1', selected_option: 'A' },
      { question_id: 'q1', selected_option: 'B' },
      { question_id: 'q3', selected_option: 'A' },
      { question_id: 'q4', selected_option: 'A' },
      { question_id: 'q5', selected_option: 'A' },
    ])

    expect(invalid).toEqual({ ok: false, reason: 'Provide exactly one answer for every question.' })
  })
})
