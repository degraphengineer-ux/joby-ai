export type FixedRubricCriterion = {
  criterion: string
  max_score: number
  description: string
}

export type ModelCriterionScore = {
  criterion: string
  score: number
  feedback: string
}

export type ScoredCriterion = ModelCriterionScore & {
  max_score: number
}

export type ScoringResult =
  | {
      ok: true
      criteria: ScoredCriterion[]
      totalScore: number
      totalMaxScore: number
    }
  | {
      ok: false
      reason: string
    }

export function scoreRubricCriteria(
  rubric: FixedRubricCriterion[],
  modelCriteria: ModelCriterionScore[],
): ScoringResult {
  const expectedNames = rubric.map((dimension) => dimension.criterion)
  const actualNames = modelCriteria.map((criterion) => criterion.criterion)
  const expected = new Set(expectedNames)
  const actual = new Set(actualNames)

  if (
    expected.size !== expectedNames.length ||
    actual.size !== actualNames.length ||
    expectedNames.length !== actualNames.length ||
    expectedNames.some((criterion) => !actual.has(criterion)) ||
    actualNames.some((criterion) => !expected.has(criterion))
  ) {
    return {
      ok: false,
      reason: `Return exactly one result for each fixed rubric criterion, with no extras: ${JSON.stringify(expectedNames)}.`,
    }
  }

  const modelByCriterion = new Map(
    modelCriteria.map((criterion) => [criterion.criterion, criterion]),
  )
  const scoredCriteria: ScoredCriterion[] = []

  for (const dimension of rubric) {
    const criterion = modelByCriterion.get(dimension.criterion)
    if (!criterion) {
      return {
        ok: false,
        reason: `Include a result for each fixed rubric criterion: ${JSON.stringify(expectedNames)}.`,
      }
    }
    if (
      !Number.isInteger(criterion.score) ||
      criterion.score < 0 ||
      criterion.score > dimension.max_score
    ) {
      return {
        ok: false,
        reason: `The score for "${dimension.criterion}" must be an integer from 0 to ${dimension.max_score}.`,
      }
    }
    scoredCriteria.push({
      criterion: dimension.criterion,
      score: criterion.score,
      max_score: dimension.max_score,
      feedback: criterion.feedback,
    })
  }

  return {
    ok: true,
    criteria: scoredCriteria,
    totalScore: scoredCriteria.reduce((total, criterion) => total + criterion.score, 0),
    totalMaxScore: rubric.reduce((total, dimension) => total + dimension.max_score, 0),
  }
}
