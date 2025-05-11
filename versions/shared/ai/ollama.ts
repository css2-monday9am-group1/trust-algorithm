import { AIInterface } from './base'

export class OllamaInterface extends AIInterface {
  constructor(private url: string, public model: string) {
    super()
  }

  async _send(prompt: string, system?: string) {
    const response = await fetch(this.url + '/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // https://ollama.readthedocs.io/en/api/#generate-a-completion
      body: JSON.stringify({ model: this.model, prompt, system, stream: false }),
    }).then((res) => res.json())
    return (response as any).response as string
  }
}
