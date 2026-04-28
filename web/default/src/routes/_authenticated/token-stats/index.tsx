import { createFileRoute, redirect } from '@tanstack/react-router'
import { TOKEN_STATS_DEFAULT_SECTION } from '@/features/token-stats/section-registry'

export const Route = createFileRoute('/_authenticated/token-stats/')({
  beforeLoad: () => {
    throw redirect({
      to: '/token-stats/$section',
      params: { section: TOKEN_STATS_DEFAULT_SECTION },
    })
  },
})