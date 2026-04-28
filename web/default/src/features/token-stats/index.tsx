import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import { TokenStatsTable } from './components/token-stats-table'

export function TokenStats() {
  const { t } = useTranslation()

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Token Statistics')}</SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('View token usage statistics by user')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Content>
        <TokenStatsTable />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}