import type { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'

/**
 * What the picker asks and how a commitment is sized. **The ranking is not here any more.**
 *
 * Until F2-04 this file held the whole ranking rule, and the picker downloaded up to 200 rows of each profile
 * table to run it in the browser. The rule now lives on the server (`LeisureDrawRanker`, behind
 * `POST /leisure-suggestion`), which ranks every row rather than a prefix, reads today's weather, and remembers
 * what it showed across devices. When the rule moved, its two client-only signals moved with it — the weather
 * exclusion and bonus, and the flat penalty for more people than an activity takes — and the client's tests
 * were ported into `LeisureDrawRankerTests`. Read that class's comment before arguing with an ordering.
 */

export type SuggestionSource = 'backlog' | 'bucketList' | 'project'

/** How many cards the picker shows. The single most important number in the module. */
export const SUGGESTION_COUNT = 3

/** The picker's input. Every field has a default, so the view can answer before the user types. */
export interface PickerConstraints {
	/** Minutes available right now. The one constraint that gates almost everything. */
	minutes: number
	/** Energy right now. */
	energy: EnergyLevel
	/** People available, including the user. */
	people: number
	/** Highest acceptable cost tier, by lookup id. `null` = any. */
	maxCostTierId: number | null
	/** Required location type, by lookup id. `null` = anywhere. */
	locationTypeId: number | null
}

/** Never book a slot shorter than this — a five-minute block in the planner is noise, not a plan. */
export const MIN_SLOT_MINUTES = 10

/**
 * How long to book for when the user commits. Never longer than they said they had, never longer than the
 * thing is worth, and never so short it is unplannable. The server carries the fact (`maxUsefulMinutes`)
 * rather than the answer, because the slot is decided at commit time.
 */
export function slotMinutesFor(
	suggestion: { maxUsefulMinutes: number | null },
	constraints: Pick<PickerConstraints, 'minutes'>,
): number {
	const useful = suggestion.maxUsefulMinutes ?? constraints.minutes
	return Math.max(Math.min(useful, constraints.minutes), MIN_SLOT_MINUTES)
}
