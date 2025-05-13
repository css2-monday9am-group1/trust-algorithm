import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import schema from './schema.js'
import versions from '../versions/index.js'
import { ChatGPTInterface } from '../versions/shared/ai/chatgpt.js'
import { OllamaInterface } from '../versions/shared/ai/ollama.js'
import { MODELS } from '../data/general.js'

let PORT = Number(process.env.PORT)
if (!PORT || isNaN(PORT)) {
  console.warn('process.env.PORT not provided or invalid, defaulting to 3000')
  PORT = 3000
}

const app = express()
app.use(bodyParser.json())
app.use(cors())

app.get('/', (_req, res) => {
  res.status(200).json({
    versions: Object.keys(versions),
    models: MODELS,
  })
})

app.post('/', async (req, res) => {
  const start = Date.now()

  const body = schema.safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ error: 'Invalid body', details: body.error })
    return
  }

  const data = body.data

  const ai =
    data.ai.type === 'chatgpt'
      ? new ChatGPTInterface(data.ai.token, data.ai.model)
      : new OllamaInterface(data.ai.url, data.ai.headers || {}, data.ai.model)

  const queryVersions = [...new Set(data.versions)]
  const promises = queryVersions.map((version) => async () => {
    const start = Date.now()
    const output = await versions[version](ai!, data.model, data.prompt, data.response)
    return { version, duration: Date.now() - start, ...output }
  })

  const outputs = await Promise.all(promises.map((promise) => promise()))

  res.status(200).json({ outputs, duration: Date.now() - start })
})

app.listen(PORT, () => {
  console.log(`Server listening: http://localhost:${PORT}`)
})
