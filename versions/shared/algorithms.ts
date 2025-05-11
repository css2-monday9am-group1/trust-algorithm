import { TRUST_ASPECTS } from '../../data/general'
import { LIMITATIONS } from '../../data/limitations.js'

export function trustScore(
  importances: number[],
  limitations: number[],
  occurrence: number[][],
  criticality: number[][],
  detection: number[][],
) {
  // Initialize T and aspectWeights
  const T: number[] = []
  const totalImportances = importances.reduce((t, c) => t + c, 0)
  const aspectWeights = importances.map((importance) => importance / totalImportances)

  for (let i = 0; i < importances.length; i++) {
    const tempT: number[] = []
    for (let j = 0; j < limitations[i]; j++) {
      // If the limitation is impossible OR completely unimportant OR will definitely be detected, it is a full score
      if (occurrence[i][j] === 10 || criticality[i][j] === 10 || detection[i][j] === 10) {
        tempT.push(10)
        // If the limitation is certain OR unacceptable OR impossible to detect, it is a zero score
      } else if (occurrence[i][j] === 0 || criticality[i][j] === 0 || detection[i][j] === 0) {
        tempT.push(0)
        // Otherwise, the values are multiplied and normalized to [0, 10]
      } else {
        tempT.push((occurrence[i][j] * criticality[i][j] * detection[i][j]) ** (1 / 3))
      }
    }

    const tempTScore = tempT.includes(0) ? 0 : tempT.reduce((t, c) => t + c, 0) / tempT.length
    T.push(aspectWeights[i] * tempTScore)
  }

  return T.reduce((t, c) => t + c, 0) * 10
}

export function trustScorePrompt(
  importances: number[],
  limitations: number[],
  occurrence: number[][],
  criticality: number[][],
  detection: number[][],
  encountered: boolean[][],
) {
  // Initialize T and aspectWeights
  const T: number[] = []
  const totalImportances = importances.reduce((t, c) => t + c, 0)
  const aspectWeights = importances.map((importance) => importance / totalImportances)

  for (let i = 0; i < importances.length; i++) {
    const tempT: number[] = []
    for (let j = 0; j < limitations[i]; j++) {
      const occ = occurrence[i][j]
      const crit = criticality[i][j]
      const det = detection[i][j]
      const enc = encountered[i][j]

      // Only penalize when issue is present AND undetectable
      let score = 10
      if (enc && det < 5) {
        const expectedDetection = 10 - occ
        const mismatch = (det - expectedDetection) / 10
        score = 10 * (1 - mismatch ** 2)
      }

      // Only factor in criticality if the issue is actually present
      let weight = det / 10
      if (enc) {
        weight *= crit / 10
      }

      tempT.push(score * weight)
    }

    const tempTScore = tempT.reduce((t, c) => t + c, 0) / tempT.length
    T.push(aspectWeights[i] * tempTScore)
  }

  return T.reduce((t, c) => t + c, 0) * 10
}

export function trustScorePromptWithStats(
  importances: number[],
  limitations: number[],
  occurrence: number[][],
  criticality: number[][],
  detection: number[][],
  encountered: boolean[][],
) {
  // Initialize T and aspectWeights
  const T: number[] = []
  const totalImportances = importances.reduce((t, c) => t + c, 0)
  const aspectWeights = importances.map((importance) => importance / totalImportances)

  const penalties: number[][] = []

  for (let i = 0; i < importances.length; i++) {
    const tempT: number[] = []

    penalties[i] = []

    for (let j = 0; j < limitations[i]; j++) {
      const occ = occurrence[i][j]
      const crit = criticality[i][j]
      const det = detection[i][j]
      const enc = encountered[i][j]

      let score
      if (enc) {
        // If we encountered the limitation, we should penalize based on how likely it was to encounter it
        let penalty = occ / 10
        // We should reduce the penalty (rely on it less) if this limitation is unreliable to detect
        penalty *= det / 10
        // Score becomes the inverse of the penalty
        score = 10 * (1 - penalty ** 2 * (crit / 10))
        penalties[i][j] = penalty
      } else {
        // If we did not encounter the limitation, we should penalize if we were expecting to
        let penalty = (10 - occ) / 10
        // penalty **= 10
        // Extra reduction of the penalty in this case, because it relates to reliability of the model rather than
        //   issues with the given response
        // penalty *= 0.5
        // We should reduce the penalty (rely on it less) if this limitation is unreliable to detect
        penalty *= det / 10
        // Score becomes the inverse of the penalty
        score = 10 * (1 - penalty ** 2 * (crit / 10))
        penalties[i][j] = penalty
      }

      tempT.push(score)
    }

    const tempTScore = tempT.reduce((t, c) => t + c, 0) / tempT.length
    T.push(aspectWeights[i] * tempTScore)
  }

  return {
    aspects: TRUST_ASPECTS.map((aspect, i) => ({
      aspect,
      weighting: aspectWeights[i],
      score: (T[i] / aspectWeights[i]) * 10,
      limitations: encountered[i].filter((lim) => lim).length,
    })),
    limitations: encountered
      .map((subEncountered, i) =>
        subEncountered.map((enc, j) => {
          const limitation = LIMITATIONS.filter((limitation) => limitation.aspect === TRUST_ASPECTS[i])[j]
          return {
            limitation: limitation.name,
            description: limitation.description,
            occurrence: occurrence[i][j],
            criticality: criticality[i][j],
            encountered: enc,
            penalty: penalties[i][j],
          }
        }),
      )
      .flat(),
    score: T.reduce((t, c) => t + c, 0) * 10,
  }
}
