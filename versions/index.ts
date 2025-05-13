import type { Model } from '../data/general.js'
import type { AIInterface, Result } from './shared/ai/base.js'
import { trust as trustV0_0 } from './v0.0/index.js'
import { trust as trustV0_1 } from './v0.1/index.js'
import { trust as trustV0_2 } from './v0.2/index.js'

export const VERSIONS = ['v0.0', 'v0.1', 'v0.2'] as const
export type Version = (typeof VERSIONS)[number]

type GeneralTrustFunction = (
  ai: AIInterface,
  model: Model,
  prompt: string,
  response: string,
) => Promise<Result<unknown>>

export default {
  'v0.0': trustV0_0,
  'v0.1': trustV0_1,
  'v0.2': trustV0_2,
} satisfies Record<Version, GeneralTrustFunction>
