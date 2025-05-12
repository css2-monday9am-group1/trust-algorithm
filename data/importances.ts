import { TRUST_ASPECTS, type TrustAspect } from './general.js'

export const CATEGORIES = ['Calculation', 'Opinion', 'Informational', 'Advice', 'Other'] as const
export type Category = (typeof CATEGORIES)[number]

type AspectImportances = Record<TrustAspect, number>

const CATEGORY_CALCULATION: AspectImportances = {
  Accuracy: 9.3,
  Consistency: 9.3,
  Explainability: 7.2,
  Fairness: 0.9,
}

const CATEGORY_OPINION: AspectImportances = {
  Accuracy: 2.1,
  Consistency: 7.8,
  Explainability: 5.1,
  Fairness: 6.6,
}

const CATEGORY_INFORMATIONAL: AspectImportances = {
  Accuracy: 7.2,
  Consistency: 7.7,
  Explainability: 6.7,
  Fairness: 5.5,
}

const CATEGORY_ADVICE: AspectImportances = {
  Accuracy: 6.8,
  Consistency: 8.1,
  Explainability: 5.7,
  Fairness: 3.3,
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
