import { AIInterface } from '../shared/ai/base.js'
import { trustScorePromptWithStats } from '../shared/algorithms.js'

export async function trust(ai: AIInterface, prompt: string, response: string) {
  const aspects = ['Accuracy', 'Explainability', 'Consistency', 'Fairness']

  const importanceResults = await Promise.all(aspects.map((aspect) => ai.queryAspectImportance(aspect, prompt)))

  const importances: number[] = []
  for (const result of importanceResults) {
    if (!result.success) return result
    importances.push(result.result)
  }

  const limitations = [1, 1, 1, 1]

  const occurrenceResults = await Promise.all(aspects.map((aspect) => ai.queryAspectRating(aspect, prompt, response)))

  const occurrences: number[][] = []
  for (const result of occurrenceResults) {
    if (!result.success) return result
    occurrences.push([result.result])
  }

  const criticality = [[10], [9], [8], [8]]

  const detection = [[8], [9], [9], [9]]

  const encountered = occurrences.map((l) => l.map((v) => v < 5))

  return {
    success: true as const,
    result: {
      category: null,
      ...trustScorePromptWithStats(importances, limitations, occurrences, criticality, detection, encountered),
    },
  }
}
