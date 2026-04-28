import { z } from 'zod'

export const tokenStatSchema = z.object({
  username: z.string(),
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
})

export type TokenStat = z.infer<typeof tokenStatSchema>

export interface GetTokenStatsParams {
  start_timestamp?: number
  end_timestamp?: number
  username?: string
  model_name?: string
  token_name?: string
  channel?: number
  group?: string
}

export interface GetTokenStatsResponse {
  success: boolean
  message?: string
  data?: TokenStat[]
}