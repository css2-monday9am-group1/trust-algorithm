import type { Model } from '../../data/general.js'
import { CATEGORY_IMPORTANCES } from '../../data/importances.js'
import { MODEL_PARAMETERS } from '../../data/limitations.js'
import { AIInterface } from '../shared/ai/base.js'
import { trustScorePromptWithStats } from '../shared/algorithms.js'

export async function trust(ai: AIInterface, model: Model, prompt: string, _response: string) {
  const category = await ai.queryQuestionCategory(prompt)

  return {
    category,
    ...trustScorePromptWithStats(
      CATEGORY_IMPORTANCES[category],
      MODEL_PARAMETERS[model].limitations,
      MODEL_PARAMETERS[model].occurrence,
      MODEL_PARAMETERS[model].criticality,
      MODEL_PARAMETERS[model].detection,
      MODEL_PARAMETERS[model].occurrence.map((l) => l.map((v) => v < 5)),
    ),
  }
}
