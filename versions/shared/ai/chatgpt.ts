import { AIInterface } from './base'

export class ChatGPTInterface extends AIInterface {
  constructor(private token: string, public model: string) {
    super()
  }

  async _send(prompt: string, system?: string) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      // https://platform.openai.com/docs/api-reference/responses/create
      body: JSON.stringify({ model: this.model, input: prompt, instructions: system }),
    }).then((res) => res.json())
    return (response as any).output[0].content
      .filter((c: { type: string; text: string | null }) => c.type === 'output_text' && c.text !== null)
      .map((c: { text: string }) => c.text)
      .join('\n') as string
  }
}
