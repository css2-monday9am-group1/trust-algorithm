import { AIInterface, type Result } from './base'

export class ChatGPTInterface extends AIInterface {
  constructor(private token: string, public model: string) {
    super()
  }

  async generate(prompt: string, system?: string): Promise<Result<string>> {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      // https://platform.openai.com/docs/api-reference/responses/create
      body: JSON.stringify({ model: this.model, input: prompt, instructions: system }),
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

    const result = (json as any).output[0].content
      .filter((c: { type: string; text: string | null }) => c.type === 'output_text' && c.text !== null)
      .map((c: { text: string }) => c.text)
      .join('\n') as string

    return { success: true, result }
  }
}
