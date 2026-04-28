import { createFileRoute, redirect } from '@tanstack/react-router'
import { TokenStats } from '@/features/token-stats'
import {
  TOKEN_STATS_SECTION_IDS,
  TOKEN_STATS_DEFAULT_SECTION,
} from '@/features/token-stats/section-registry'

export const Route = createFileRoute('/_authenticated/token-stats/$section')({
  beforeLoad: ({ params }) => {
    const validSections = TOKEN_STATS_SECTION_IDS as unknown as string[]
    if (!validSections.includes(params.section)) {
      throw redirect({
        to: '/token-stats/$section',
        params: { section: TOKEN_STATS_DEFAULT_SECTION },
      })
    }
  },
  component: TokenStats,
})