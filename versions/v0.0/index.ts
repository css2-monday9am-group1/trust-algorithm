import { AIInterface } from '../shared/ai/base.js'
import { trustScorePromptWithStats } from '../shared/algorithms.js'

export async function trust(ai: AIInterface, prompt: string, response: string) {
  const aspects = ['Accuracy', 'Explainability', 'Consistency', 'Fairness']

  const importances = await Promise.all(aspects.map((aspect) => ai.queryAspectImportance(aspect, prompt)))

  const limitations = [1, 1, 1, 1]

  const occurrences = await Promise.all(
    aspects.map((aspect) => ai.queryAspectRating(aspect, prompt, response).then((r) => [r])),
  )

  const criticality = [[10], [9], [8], [8]]

  const detection = [[8], [9], [9], [9]]

  const encountered = occurrences.map((l) => l.map((v) => v < 5))

  return {
    category: null,
    ...trustScorePromptWithStats(importances, limitations, occurrences, criticality, detection, encountered),
  }
}
