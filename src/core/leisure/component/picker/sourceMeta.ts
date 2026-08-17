import type { SuggestionSource } from '@/core/leisure/composable/leisureScoring.ts'

/**
 * How each of the three pools reads on a card. The icons are the ones the sidebar already uses for
 * the corresponding table, so a suggestion is visibly "one of those" before the label is read.
 *
 * Colours are picked for `variant="tonal"` chips, which per `CLAUDE.md` means the outline/semantic
 * palette rather than the elevated one.
 */
export const SOURCE_META: Record<
	SuggestionSource,
	{ icon: string; color: string; labelKey: string; routeName: string }
> = {
	backlog: {
		icon: 'fas fa-box-archive',
		color: 'primaryOutline',
		labelKey: 'leisure.backlog',
		routeName: 'leisureBacklog',
	},
	project: {
		icon: 'fas fa-screwdriver-wrench',
		color: 'warning',
		labelKey: 'leisure.projects',
		routeName: 'leisureProjects',
	},
	bucketList: {
		icon: 'fas fa-star',
		color: 'secondaryOutline',
		labelKey: 'leisure.bucketList',
		routeName: 'leisureBucketList',
	},
}
