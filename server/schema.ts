import { z } from 'zod'
import { MODELS } from '../data/general.js'

export default z.object({
  versions: z.enum(['v0.0', 'v0.1', 'v0.2']).array(),
  model: z.enum(MODELS),
  prompt: z.string(),
  response: z.string(),
  ai: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('chatgpt'),
      token: z.string(),
      model: z.string(),
    }),
    z.object({
      type: z.literal('ollama'),
      url: z.string(),
      model: z.string(),
    }),
  ]),
})
