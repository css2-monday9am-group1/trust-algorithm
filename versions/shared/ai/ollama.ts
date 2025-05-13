import { AIInterface, type Result } from './base'

export class OllamaInterface extends AIInterface {
  constructor(private url: string, private headers: Record<string, string>, private model: string) {
    super()
  }

  async generate(prompt: string, system?: string): Promise<Result<string>> {
    const res = await fetch(this.url + '/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      // https://ollama.readthedocs.io/en/api/#generate-a-completion
      body: JSON.stringify({ model: this.model, prompt, system, stream: false }),
    })

    if (res.status !== 200) {
      let body = '(none)'
      try {
        body = await res.text()
      } catch {}
      return { success: false, step: 'ai-fetch', error: `Unexpected status code ${res.status} with body: ${body}` }
    }

    let text
    let json
    try {
      text = await res.text()
      json = JSON.parse(text)
    } catch {
      return { success: false, step: 'ai-parse', error: `Failed to parse JSON response from body: ${text}` }
    }

    const result = (json as any).response as string

    return { success: true, result }
  }
}
