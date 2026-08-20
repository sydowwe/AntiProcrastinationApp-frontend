import { getDomainColor } from '@/_common/utils/domainColor.ts'

/**
 * Resolves the colour of one dashboard group row — a pie segment, a summary card, a stacked-bar segment.
 *
 * B2: `color` comes back null far more often than a `?? null` guard suggests. The backend's resolver
 * returns a colour only for Role and Category groups (plus the pie chart's hard-coded `_other` grey), so
 * **every row of an activity-grouped chart is colourless**, as is the synthetic `Uncategorized` bucket
 * under `groupBy: CATEGORY`. Without a fallback those charts render with no colour at all.
 *
 * The fallback is keyed by `groupId`:
 *
 * - not by array index — the ordering changes on every refetch, so the colours would shuffle;
 * - not by `name` — a rename would recolour the group, and names are not what identifies a row
 *   (see `HistoryGroupKey.ts`).
 *
 * A group therefore keeps one colour across re-fetches and across the pie / bar / card views of the
 * same response. The two rows that carry no `groupId` are the backend's synthetic buckets, of which
 * there is exactly one each per response, so those fall back to the name hash — which already
 * special-cases `_other` to grey.
 */
const GROUP_PALETTE = [
	'#3B82F6',
	'#10B981',
	'#F59E0B',
	'#EF4444',
	'#8B5CF6',
	'#EC4899',
	'#14B8A6',
	'#F97316',
	'#6366F1',
	'#84CC16',
	'#06B6D4',
	'#D946EF',
	'#22C55E',
	'#EAB308',
	'#0EA5E9',
	'#A855F7',
	'#F43F5E',
	'#2DD4BF',
	'#FB923C',
	'#7C3AED',
] as const

export function resolveHistoryGroupColor(item: { groupId: number | null; name: string; color: string | null }): string {
	if (item.color) return item.color
	if (item.groupId === null) return getDomainColor(item.name)
	return GROUP_PALETTE[Math.abs(item.groupId) % GROUP_PALETTE.length]!
}
