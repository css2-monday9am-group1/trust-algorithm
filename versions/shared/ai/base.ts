import { createHash } from 'crypto'
import { CATEGORIES, type Category } from '../../../data/importances.js'

const CACHE = new Map<string, Promise<string>>()

export abstract class AIInterface {
  abstract _send(prompt: string, system?: string): Promise<string>

  async send(prompt: string, system?: string): Promise<string> {
    const key = createHash('sha1').update(`${prompt},${system}`).digest('base64')
    const existing = CACHE.get(key)
    if (existing) return existing

    const promise = this._send(prompt, system)
    CACHE.set(key, promise)
    return await promise
  }

  static BASE_SYSTEM =
    'You are helping to extract information from prompts and responses in conversions with other Generative AI conversation models.'

  async queryQuestionCategory(prompt: string) {
    const result = await this.send(
      `Identify which category best describes this prompt:\n\n${prompt}`,
      [
        AIInterface.BASE_SYSTEM,
        `You are required to answer with one of the following categories: ${CATEGORIES.join(', ')}.`,
        'Do not add any additional text.',
        'Choose the most appropriate category, or use Other if none of the other categories can apply.',
      ].join('\n'),
    )
    return this.forceExtractQuestionCategoryFromString(result)
  }

  async queryAspectRating(aspect: string, prompt: string, response: string) {
    const result = await this.send(
      `Rate the ${aspect} of this response from 0-10:\n\nPrompt: ${prompt}\n\nResponse: ${response}`,
      [
        AIInterface.BASE_SYSTEM,
        `You are required to answer with a number from 0 to 10.`,
        'Do not add any additional text.',
      ].join('\n'),
    )
    return this.forceExtractRatingFromString(result)
  }

  async queryAspectImportance(aspect: string, prompt: string) {
    const result = await this.send(
      `How important would the ${aspect} aspect be, from 0-10, in the response to this prompt:\n\n${prompt}`,
      [
        AIInterface.BASE_SYSTEM,
        `You are required to answer with a number from 0 to 10.`,
        'Do not add any additional text.',
      ].join('\n'),
    )
    return this.forceExtractRatingFromString(result)
  }

  async queryLimitationEncountered(limitation: string, prompt: string, response: string) {
    const question = {
      Inaccuracy: 'Identify whether the response in the following conversation contains any data inaccuracies',
      Disconnect: 'Identify whether the response fails to make any sense in relation to the prompt',
      'Under-explanation':
        'Identify whether the model fails to explain how it reached any conclusions present in the response',
      Confusion:
        'Identify whether BOTH of the following are true: 1. the prompt contains noisy, incomplete or corrupted data, AND 2. the response fails to understand the prompt as a result',
      Contradiction: 'Identify whether the model contradicts itself in the response',
      Unfairness:
        'Identify whether the response disproportionally benefits or disadvantages specific groups based on sensitive attributes',
    }[limitation]
    const result = await this.send(
      `${question}:\n\nPrompt: ${prompt}\n\nResponse: ${response}`,
      [
        AIInterface.BASE_SYSTEM,
        `You are required to answer with 'Yes' or 'No'.`,
        'Do not add any additional text.',
      ].join('\n'),
    )
    return this.forceExtractBooleanFromString(result)
  }

  forceExtractRatingFromString(response: string): number {
    const ratings = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    for (const rating of ratings) {
      const indexOfFloat = response.indexOf(`${rating}.`)
      if (indexOfFloat >= 0) {
        const match = response.slice(indexOfFloat).match(/\d+.\d+/)
        return match && match[0] ? Number(match[0]) : rating
      }

      if (response.includes(`${rating}`)) {
        return rating
      }
    }

    throw new Error(`Failed to find any 0-10 rating in the given response:\n${response}`)
  }

  forceExtractQuestionCategoryFromString(response: string): Category {
    for (const category of CATEGORIES) {
      if (response.toLowerCase().includes(category.toLowerCase())) {
        return category
      }
    }

    throw new Error(`Failed to find any question category in the given response:\n${response}`)
  }

  forceExtractBooleanFromString(response: string): boolean {
    const responseLower = response.toLowerCase()
    if (responseLower.includes('yes')) return true
    if (responseLower.includes('no')) return false
    if (responseLower.includes('true')) return true
    if (responseLower.includes('false')) return false

    throw new Error(`Failed to find any boolean value in the given response:\n${response}`)
  }
}
