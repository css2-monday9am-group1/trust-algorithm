import { z } from 'zod'
import { MODELS } from '../data/general.js'
import { VERSIONS } from '../versions/index.js'

export default z.object({
  versions: z.enum(VERSIONS).array(),
  model: z.enum(MODELS),
  prompt: z.string().trim().nonempty(),
  response: z.string().trim().nonempty(),
  ai: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('chatgpt'),
      token: z.string(),
      model: z.string(),
    }),
    z.object({
      type: z.literal('ollama'),
      url: z.string(),
      headers: z.record(z.string()).optional(),
      model: z.string(),
    }),
  ]),
})
