import { TRUST_ASPECTS, type TrustAspect } from './general.js'

export const CATEGORIES = ['Calculation', 'Opinion', 'Informational', 'Advice', 'Other'] as const
export type Category = (typeof CATEGORIES)[number]

type AspectImportances = Record<TrustAspect, number>

const CATEGORY_CALCULATION: AspectImportances = {
  Accuracy: 9.3,
  Consistency: 7.8,
  Explainability: 8.0,
  Fairness: 1.7,
}

const CATEGORY_OPINION: AspectImportances = {
  Accuracy: 2.3,
  Consistency: 2.5,
  Explainability: 6.3,
  Fairness: 5.2,
}

const CATEGORY_INFORMATIONAL: AspectImportances = {
  Accuracy: 5.6,
  Consistency: 5.5,
  Explainability: 7.3,
  Fairness: 4.4,
}

const CATEGORY_ADVICE: AspectImportances = {
  Accuracy: 6.3,
  Consistency: 4.9,
  Explainability: 7.3,
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
