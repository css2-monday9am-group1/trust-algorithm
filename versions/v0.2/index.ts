import { TRUST_ASPECTS, type Model } from '../../data/general.js'
import { CATEGORY_IMPORTANCES } from '../../data/importances.js'
import { LIMITATIONS, MODEL_PARAMETERS } from '../../data/limitations.js'
import { AIInterface } from '../shared/ai/base.js'
import { trustScorePromptWithStats } from '../shared/algorithms.js'

export async function trust(ai: AIInterface, model: Model, prompt: string, response: string) {
  const category = await ai.queryQuestionCategory(prompt)
  if (!category.success) return category

  const encounters = await Promise.all(
    LIMITATIONS.map((limitation) =>
      ai
        .queryLimitationEncountered(limitation.name, prompt, response)
        .then((result) => ({ aspect: limitation.aspect, result })),
    ),
  )

  const encountered = TRUST_ASPECTS.map(() => [] as boolean[])

  for (const { aspect, result } of encounters) {
    if (!result.success) return result
    encountered[TRUST_ASPECTS.indexOf(aspect)].push(result.result)
  }

  return {
    success: true as const,
    result: {
      category: category.result,
      ...trustScorePromptWithStats(
        CATEGORY_IMPORTANCES[category.result],
        MODEL_PARAMETERS[model].limitations,
        MODEL_PARAMETERS[model].occurrence,
        MODEL_PARAMETERS[model].criticality,
        MODEL_PARAMETERS[model].detection,
        encountered,
      ),
    },
  }
}
