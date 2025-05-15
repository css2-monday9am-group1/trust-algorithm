import { createHash } from 'crypto'
import { CATEGORIES, type Category } from '../../../data/importances.js'

const CACHE = new Map<string, Promise<Result<string>>>()

export type Result<T> = { success: true; result: T } | { success: false; step: string; error: string }

export abstract class AIInterface {
  abstract generate(prompt: string, system?: string): Promise<Result<string>>

  async sendWithRetries(retries: number, prompt: string, system?: string): Promise<Result<string>> {
    return this.generate(prompt, system).then((result) => {
      if (!result.success && retries > 0) return this.sendWithRetries(retries - 1, prompt, system)
      return result
    })
  }

  async send(prompt: string, system?: string): Promise<Result<string>> {
    const key = createHash('sha1').update(`${prompt},${system}`).digest('base64')
    const existing = CACHE.get(key)
    if (existing) return existing

    const promise = this.sendWithRetries(2, prompt, system)
    CACHE.set(key, promise)
    const result = await promise
    if (!result.success) setImmediate(() => CACHE.delete(key))
    return result
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

    if (!result.success) return result
    return this.forceExtractQuestionCategoryFromString(result.result)
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
    if (!result.success) return result
    return this.forceExtractRatingFromString(result.result)
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
    if (!result.success) return result
    return this.forceExtractRatingFromString(result.result)
  }

  async queryLimitationEncountered(limitation: string, prompt: string, response: string) {
    const question = {
      Inaccuracy:
        'Identify whether the response in the following conversation is objectively incorrect or contains any data inaccuracies, ignoring subjective material',
      Disconnect: 'Identify whether the response appears to be completely disconnected from the original prompt',
      'Under-explanation':
        'Identify whether the model fails to explain how it reached any conclusions or answers present in the response',
      Confusion:
        'Identify whether BOTH of the following are true: 1. the prompt contains noisy, incomplete or corrupted data, AND 2. the response fails to understand the prompt as a result',
      Contradiction:
        'Identify whether the response contradicts itself by proving conflicting pieces of information in the same response',
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
    if (!result.success) return result
    return this.forceExtractBooleanFromString(result.result)
  }

  forceExtractRatingFromString(response: string): Result<number> {
    const ratings = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    for (const rating of ratings) {
      const indexOfFloat = response.indexOf(`${rating}.`)
      if (indexOfFloat >= 0) {
        const match = response.slice(indexOfFloat).match(/\d+.\d+/)
        return { success: true, result: match && match[0] ? Number(match[0]) : rating }
      }

      if (response.includes(`${rating}`)) {
        return { success: true, result: rating }
      }
    }

    return {
      success: false,
      step: 'ai-extract',
      error: `Failed to find any 0-10 rating in the given response:\n${response}`,
    }
  }

  forceExtractQuestionCategoryFromString(response: string): Result<Category> {
    for (const category of CATEGORIES) {
      if (response.toLowerCase().includes(category.toLowerCase())) {
        return { success: true, result: category }
      }
    }

    return {
      success: false,
      step: 'ai-extract',
      error: `Failed to find any question category in the given response:\n${response}`,
    }
  }

  forceExtractBooleanFromString(response: string): Result<boolean> {
    const responseLower = response.toLowerCase()
    if (responseLower.includes('yes')) return { success: true, result: true }
    if (responseLower.includes('no')) return { success: true, result: false }
    if (responseLower.includes('true')) return { success: true, result: true }
    if (responseLower.includes('false')) return { success: true, result: false }

    return {
      success: false,
      step: 'ai-extract',
      error: `Failed to find any boolean value in the given response:\n${response}`,
    }
  }
}
