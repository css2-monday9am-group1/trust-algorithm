import { MODELS, TRUST_ASPECTS, type Model, type TrustAspect } from './general.js'

const BASELINE_DETECTION = 9.9

interface TrustAspectLimitation {
  name: string
  description: string
  aspect: TrustAspect
  /** The algorithmic parameters for this limitation (occurrence, criticality and detection) */
  parameters_baseline: TrustAspectLimitationParameters
  /** Per-model algorithmic parameters for this limitation that override the baseline parameters */
  parameters?: Partial<Record<Model, Partial<TrustAspectLimitationParameters>>>
}

interface TrustAspectLimitationParameters {
  /** Occurrence score - higher means a lower likelihood that this limitation will occur (0 = "certain", 10 = "impossible")  */
  occurrence: number
  /** Criticality score - how critical this limitation is (0 = "does not matter", 10 = "absolutely critical") */
  criticality: number
  /** Detection score - ability for this limitation to be detected (0 = "impossible", 10 = "certain") */
  detection: number
}

export const LIMITATIONS: TrustAspectLimitation[] = [
  {
    name: 'Inaccuracy',
    description: "The model's response is incorrect or includes data inaccuracies.",
    aspect: 'Accuracy',
    parameters_baseline: {
      occurrence: 7.8,
      criticality: 9,
      detection: BASELINE_DETECTION,
    },
  },
  {
    name: 'Disconnect',
    description: "The model's response does not make sense in connection to the user's prompt.",
    aspect: 'Explainability',
    parameters_baseline: {
      occurrence: 9.5,
      criticality: 10,
      detection: BASELINE_DETECTION,
    },
  },
  {
    name: 'Under-explanation',
    description: 'The model fails to explain how it reached its conclusion.',
    aspect: 'Explainability',
    parameters_baseline: {
      occurrence: 6.6,
      criticality: 5,
      detection: BASELINE_DETECTION,
    },
  },
  {
    name: 'Confusion',
    description: 'The model fails to understand the prompt due to noisy, incomplete or corrupted data.',
    aspect: 'Consistency',
    parameters_baseline: {
      occurrence: 8.1,
      criticality: 5,
      detection: BASELINE_DETECTION,
    },
  },
  {
    name: 'Contradiction',
    description: "The model's response includes contradictions against itself.",
    aspect: 'Consistency',
    parameters_baseline: {
      occurrence: 9.9,
      criticality: 7,
      detection: BASELINE_DETECTION,
    },
  },
  {
    name: 'Unfairness',
    description:
      "The model's response disproportionally benefits or disadvantages specific groups based on sensitive attributes.",
    aspect: 'Fairness',
    parameters_baseline: {
      occurrence: 9.9,
      criticality: 10,
      detection: BASELINE_DETECTION,
    },
  },
]

function calculateParametersForModel(model: Model) {
  const parameters = {
    limitations: [] as number[],
    occurrence: [] as number[][],
    criticality: [] as number[][],
    detection: [] as number[][],
  }

  for (const aspect of TRUST_ASPECTS) {
    const limitations = LIMITATIONS.filter((limitation) => limitation.aspect === aspect)
    parameters.limitations.push(limitations.length)
    for (const parameter of ['occurrence', 'criticality', 'detection'] as const) {
      parameters[parameter].push(
        limitations.map(
          (limitation) =>
            (model && limitation.parameters?.[model]?.[parameter]) || limitation.parameters_baseline[parameter],
        ),
      )
    }
  }

  return parameters
}

export const MODEL_PARAMETERS = Object.fromEntries(
  MODELS.map((model) => [model, calculateParametersForModel(model)] as const),
) as Record<Model, ReturnType<typeof calculateParametersForModel>>
