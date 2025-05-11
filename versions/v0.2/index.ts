import { TRUST_ASPECTS, type Model } from '../../data/general.js'
import { CATEGORY_IMPORTANCES } from '../../data/importances.js'
import { LIMITATIONS, MODEL_PARAMETERS } from '../../data/limitations.js'
import { AIInterface } from '../shared/ai/base.js'
import { trustScorePromptWithStats } from '../shared/algorithms.js'

export async function trust(ai: AIInterface, model: Model, prompt: string, response: string) {
  const category = await ai.queryQuestionCategory(prompt)

  const groupings = await Promise.all(
    LIMITATIONS.map((limitation) =>
      ai
        .queryLimitationEncountered(limitation.name, prompt, response)
        .then((encountered) => ({ aspect: limitation.aspect, encountered })),
    ),
  )

  const encountered = TRUST_ASPECTS.map((aspect) =>
    groupings.filter((limitation) => limitation.aspect === aspect).map((limitation) => limitation.encountered),
  )

  return {
    category,
    ...trustScorePromptWithStats(
      CATEGORY_IMPORTANCES[category],
      MODEL_PARAMETERS[model].limitations,
      MODEL_PARAMETERS[model].occurrence,
      MODEL_PARAMETERS[model].criticality,
      MODEL_PARAMETERS[model].detection,
      encountered,
    ),
  }
}
