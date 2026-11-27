export type QuizQuestionForScoring = {
  id: string
  question: string
  correct_option: string
  explanation: string
}

export type QuizAnswerForScoring = {
  question_id: string
  selected_option: string
}

export type ScoredQuizQuestion = {
  question_id: string
  question: string
  selected_option: string
  correct_option: string
  is_correct: boolean
  explanation: string
}

export function scoreQuiz(
  questions: QuizQuestionForScoring[],
  answers: QuizAnswerForScoring[],
):
  | { ok: true; score: number; results: ScoredQuizQuestion[] }
  | { ok: false; reason: string } {
  if (questions.length !== 5 || answers.length !== questions.length) {
    return { ok: false, reason: 'Answer every question before submitting.' }
  }

  const answersById = new Map(answers.map((answer) => [answer.question_id, answer.selected_option]))
  if (
    answersById.size !== questions.length ||
    questions.some((question) => !answersById.has(question.id))
  ) {
    return { ok: false, reason: 'Provide exactly one answer for every question.' }
  }

  const results = questions.map((question) => {
    const selectedOption = answersById.get(question.id) ?? ''
    return {
      question_id: question.id,
      question: question.question,
      selected_option: selectedOption,
      correct_option: question.correct_option,
      is_correct: selectedOption === question.correct_option,
      explanation: question.explanation,
    }
  })

  return {
    ok: true,
    score: results.filter(({ is_correct }) => is_correct).length,
    results,
  }
}
