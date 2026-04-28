import { createSectionRegistry } from '@/features/system-settings/utils/section-registry'

/**
 * Token statistics page section definitions
 */
const TOKEN_STATS_SECTIONS = [
  {
    id: 'overview',
    titleKey: 'Token Statistics',
    descriptionKey: 'View token usage statistics by user',
    build: () => null,
  },
] as const

export type TokenStatsSectionId = (typeof TOKEN_STATS_SECTIONS)[number]['id']

const tokenStatsRegistry = createSectionRegistry<
  TokenStatsSectionId,
  Record<string, never>,
  []
>({
  sections: TOKEN_STATS_SECTIONS,
  defaultSection: 'overview',
  basePath: '/token-stats',
  urlStyle: 'path',
})

export const TOKEN_STATS_SECTION_IDS = tokenStatsRegistry.sectionIds
export const TOKEN_STATS_DEFAULT_SECTION = tokenStatsRegistry.defaultSection

export function isTokenStatsSectionId(s: string): s is TokenStatsSectionId {
  return (TOKEN_STATS_SECTION_IDS as readonly string[]).includes(s)
}

export const getTokenStatsSectionNavItems = tokenStatsRegistry.getSectionNavItems