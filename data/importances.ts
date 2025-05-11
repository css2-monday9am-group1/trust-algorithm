import { TRUST_ASPECTS, type TrustAspect } from './general.js'

export const CATEGORIES = ['Calculation', 'Opinion', 'Informational', 'Advice', 'Other'] as const
export type Category = (typeof CATEGORIES)[number]

type AspectImportances = Record<TrustAspect, number>

const CATEGORY_CALCULATION: AspectImportances = {
  Accuracy: 9.7,
  Consistency: 9.7,
  Explainability: 8.5,
  Fairness: 3.6,
}

const CATEGORY_OPINION: AspectImportances = {
  Accuracy: 5.3,
  Consistency: 9.1,
  Explainability: 7.7,
  Fairness: 8.2,
}

const CATEGORY_INFORMATIONAL: AspectImportances = {
  Accuracy: 8.6,
  Consistency: 8.8,
  Explainability: 8.3,
  Fairness: 8.1,
}

const CATEGORY_ADVICE: AspectImportances = {
  Accuracy: 8.5,
  Consistency: 9.1,
  Explainability: 7.8,
  Fairness: 6.3,
}

const ALL_CATEGORIES = [CATEGORY_CALCULATION, CATEGORY_OPINION, CATEGORY_INFORMATIONAL, CATEGORY_ADVICE]

export const CATEGORY_IMPORTANCES: Record<Category, number[]> = {
  Calculation: Object.values(CATEGORY_CALCULATION),
  Opinion: Object.values(CATEGORY_OPINION),
  Informational: Object.values(CATEGORY_INFORMATIONAL),
  Advice: Object.values(CATEGORY_ADVICE),
  Other: TRUST_ASPECTS.map((aspect) => {
    const values = ALL_CATEGORIES.map((category) => category[aspect])
    return values.reduce((t, c) => t + c, 0) / values.length
  }),
}
