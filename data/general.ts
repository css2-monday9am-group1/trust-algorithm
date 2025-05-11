export const TRUST_ASPECTS = ['Accuracy', 'Explainability', 'Consistency', 'Fairness'] as const
export type TrustAspect = (typeof TRUST_ASPECTS)[number]

export const MODELS = ['gpt-4o', 'unknown'] as const
export type Model = (typeof MODELS)[number]
