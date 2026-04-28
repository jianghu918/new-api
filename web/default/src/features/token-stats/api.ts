import { api } from '@/lib/api'
import { buildQueryParams } from '@/features/usage-logs/lib/utils'
import type {
  GetTokenStatsParams,
  GetTokenStatsResponse,
} from './types'

export async function getTokenStats(
  params: GetTokenStatsParams = {}
): Promise<GetTokenStatsResponse> {
  const queryParams = buildQueryParams(
    params as unknown as Record<string, unknown>
  )
  const res = await api.get(`/api/log/token_stats?${queryParams}`)
  return res.data
}