import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useIsAdmin } from '@/hooks/use-admin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CompactDateTimeRangePicker } from '@/features/usage-logs/components/compact-date-time-range-picker'
import { getDefaultTimeRange } from '@/features/usage-logs/lib/utils'
import { getTokenStats } from '../api'
import type { TokenStat } from '../types'

function formatTokensInM(tokens: number): string {
  if (tokens === 0) return '0'
  const millions = tokens / 1_000_000
  if (millions < 0.01) {
    return millions.toFixed(4) + 'm'
  }
  return millions.toFixed(2) + 'm'
}

export function TokenStatsTable() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()

  const [filters, setFilters] = useState<{
    startTime: Date | undefined
    endTime: Date | undefined
    username: string
  }>(() => {
    const { start, end } = getDefaultTimeRange()
    return { startTime: start, endTime: end, username: '' }
  })

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['token-stats', filters],
    queryFn: async () => {
      const result = await getTokenStats({
        start_timestamp: filters.startTime
          ? Math.floor(filters.startTime.getTime() / 1000)
          : undefined,
        end_timestamp: filters.endTime
          ? Math.floor(filters.endTime.getTime() / 1000)
          : undefined,
        username: filters.username || undefined,
      })

      if (!result?.success) {
        toast.error(result?.message || t('Failed to load token statistics'))
        return []
      }

      return result.data || []
    },
  })

  const stats: TokenStat[] = data || []

  // Calculate totals
  const totalPromptTokens = stats.reduce((sum, s) => sum + s.prompt_tokens, 0)
  const totalCompletionTokens = stats.reduce(
    (sum, s) => sum + s.completion_tokens,
    0
  )
  const totalTokens = stats.reduce((sum, s) => sum + s.total_tokens, 0)

  return (
    <div className='space-y-4'>
      {/* Filter Bar */}
      <div className='rounded-md border bg-card/50 p-3 shadow-xs'>
        <div className='flex flex-wrap items-center gap-3'>
          <CompactDateTimeRangePicker
            startTime={filters.startTime}
            endTime={filters.endTime}
            onStartTimeChange={(date) =>
              setFilters((f) => ({ ...f, startTime: date }))
            }
            onEndTimeChange={(date) =>
              setFilters((f) => ({ ...f, endTime: date }))
            }
          />
          {isAdmin && (
            <Input
              placeholder={t('Filter by username')}
              value={filters.username}
              onChange={(e) =>
                setFilters((f) => ({ ...f, username: e.target.value }))
              }
              className='w-40'
            />
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {t('Refresh')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <div className='rounded-lg border bg-card p-4 shadow-sm'>
          <div className='text-muted-foreground text-sm'>{t('Input Tokens (Prompt)')}</div>
          <div className='mt-1 text-2xl font-bold'>{formatTokensInM(totalPromptTokens)}</div>
        </div>
        <div className='rounded-lg border bg-card p-4 shadow-sm'>
          <div className='text-muted-foreground text-sm'>{t('Output Tokens (Completion)')}</div>
          <div className='mt-1 text-2xl font-bold'>{formatTokensInM(totalCompletionTokens)}</div>
        </div>
        <div className='rounded-lg border bg-card p-4 shadow-sm'>
          <div className='text-muted-foreground text-sm'>{t('Total Tokens')}</div>
          <div className='mt-1 text-2xl font-bold'>{formatTokensInM(totalTokens)}</div>
        </div>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('User')}</TableHead>
              <TableHead className='text-right'>{t('Input (Prompt)')}</TableHead>
              <TableHead className='text-right'>{t('Output (Completion)')}</TableHead>
              <TableHead className='text-right'>{t('Total')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className='text-center'>
                  {t('Loading...')}
                </TableCell>
              </TableRow>
            ) : stats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='text-center'>
                  {t('No data available')}
                </TableCell>
              </TableRow>
            ) : (
              stats.map((stat) => (
                <TableRow key={stat.username}>
                  <TableCell className='font-medium'>{stat.username}</TableCell>
                  <TableCell className='text-right font-mono tabular-nums'>
                    {formatTokensInM(stat.prompt_tokens)}
                  </TableCell>
                  <TableCell className='text-right font-mono tabular-nums'>
                    {formatTokensInM(stat.completion_tokens)}
                  </TableCell>
                  <TableCell className='text-right font-mono tabular-nums font-semibold'>
                    {formatTokensInM(stat.total_tokens)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}