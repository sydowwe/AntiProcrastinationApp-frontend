import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import type { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'

/**
 * The picker's ranking rule, written down.
 *
 * This file is pure — no Vue, no i18n, no network — so the rule can be read, tested and argued with
 * in one place. `useLeisurePicker.ts` adapts the three profile DTOs into `CandidateFacts` and calls
 * `pickSuggestions`; nothing else scores anything.
 *
 * ## Why a rule at all, rather than "show the matches"
 *
 * The four leisure tables already filter. A picker that filtered and listed would reproduce the
 * paralysis it exists to cure (Iyengar & Lepper 2000: bigger choice sets lower both the probability
 * of choosing and satisfaction with the choice). So the output is capped at three — see
 * `SUGGESTION_COUNT` — which makes *ordering* the entire product. Everything below is the ordering.
 *
 * ## Hard constraints (`isEligible`) — these exclude, they do not penalise
 *
 * - **Backlog**: a stated `durationMinutes` longer than the time available; a `minParticipants`
 *   above the people available. Cost tier and location type are excluded server-side by the filter
 *   (see `useLeisurePicker`), because the filter can express them and the client should not download
 *   rows only to drop them. When today's weather fit is known (`weatherMatchIds` is non-null), a
 *   `weatherDependencyId` outside it is excluded too — an activity that needs snow in July is not a
 *   suggestion, it is a taunt, same as one that needs three hours nobody has. Unknown weather excludes
 *   nothing: absence of the signal must never read as a mismatch.
 * - **Project**: `NeedsShopping` is not a suggestion, it is an errand. And a project session needs a
 *   real block of time — under `PROJECT_MIN_MINUTES` there is no point starting one. `estimatedHours`
 *   is deliberately NOT a hard constraint: it is the estimate for the whole project, not for one
 *   sitting, so excluding a 20-hour build because the user has two hours would be wrong.
 * - **Bucket list**: these rows record no duration, cost or party size at all, so the only honest
 *   time constraint is a floor — a bucket-list experience is never a 30-minute filler. Travel raises
 *   the floor again.
 *
 * ## Proxy energy
 *
 * Only the backlog records `energyLevel`. Ranking the other two sources against the user's stated
 * energy still matters — an Expert project is a bad answer to "I'm exhausted" — so both derive one:
 * difficulty for projects, comfort-zone step for bucket-list entries, both on the same 1/3/5 ramp
 * `comfortZoneColor` already uses. Derived, and labelled as derived wherever it reaches the UI.
 *
 * ## Soft signals (`scoreCandidate`) — these rank
 *
 * | signal          | applies to  | why                                                          |
 * |-----------------|-------------|--------------------------------------------------------------|
 * | energy fit      | all         | asymmetric: too demanding is worse than too easy              |
 * | duration fit    | backlog     | using most of the free time beats a 5-minute filler           |
 * | weather fit     | backlog     | a match against today's actual conditions is a happy coincidence, worth surfacing |
 * | effort variety  | all         | a different effort type from the last thing committed to      |
 * | staleness       | all         | the same three every visit is the failure mode of a top-3     |
 * | source weight   | all         | bucket list is a rare treat, not the daily driver             |
 * | readiness       | project     | ReadyToStart is actionable, Planning is not yet               |
 * | comfort step    | bucket list | the smallest untried step is the most actionable one          |
 * | jitter          | all         | a deterministic top-3 is invisible after a week               |
 *
 * The jitter is derived from the candidate key and the draw seed, not from a sequential RNG: the
 * draw must not depend on the order the three fetches happened to resolve in, and reloading a
 * `?seed=` URL must reproduce the same three cards.
 */

export type SuggestionSource = 'backlog' | 'bucketList' | 'project'

/** How many cards the picker shows. The single most important number in the module. */
export const SUGGESTION_COUNT = 3

/**
 * At most this many of the three may come from one source. Backlog is uncapped on purpose — it is
 * the pool the picker is really for. The caps shape a normal draw and are relaxed rather than
 * enforced when the eligible pool is too thin to fill three slots.
 */
export const SOURCE_CAP: Record<SuggestionSource, number> = {
	backlog: SUGGESTION_COUNT,
	bucketList: 1,
	project: 1,
}

/** Under this, starting a project is not worth the setup. */
export const PROJECT_MIN_MINUTES = 60
/** Under this, a bucket-list experience is not what the user has time for. */
export const BUCKET_LIST_MIN_MINUTES = 120
/** A bucket-list entry that requires travel needs most of a day, not an evening. */
export const BUCKET_LIST_TRAVEL_MIN_MINUTES = 240

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

/** Everything the ranking reads. `LeisureSuggestion` extends this with what the card renders. */
export interface CandidateFacts {
	/** `<source>:<activityId>` — stable across draws, and the key the staleness record is kept under. */
	key: string
	source: SuggestionSource
	activityId: number
	/**
	 * The longest this could usefully occupy: the backlog's stated duration, a project's whole
	 * estimate, `null` for a bucket-list entry that records neither. Used only to size the booked
	 * slot (`slotMinutesFor`) — never to exclude, because a project's estimate covers the whole build
	 * rather than one sitting.
	 */
	maxUsefulMinutes: number | null
	/** Stated by the backlog, derived by the other two — see "Proxy energy" above. */
	energyLevel: EnergyLevel
	/** Whether the energy above was stated or derived. Drives how the card phrases the reason. */
	energyIsDerived: boolean
	effortType: EffortType | null
	/** Backlog only — nothing else records a party size. */
	minParticipants: number | null
	/** Backlog only — the duration the user committed to when they filed the activity. */
	statedDurationMinutes: number | null
	/** Backlog only — the `activity-weather-dependency` lookup id the entry was filed under. */
	weatherDependencyId: number | null
	/** Project only. */
	readinessStatus: ReadinessStatus | null
	/** Bucket list only, 1–5. */
	comfortZoneStep: number | null
	/** Bucket list only. */
	requiresTravel: boolean
}

export interface RankingContext {
	constraints: PickerConstraints
	/** Candidate key → ISO instant it was last put in front of the user. */
	lastSuggestedAt: Readonly<Record<string, string>>
	/** Effort type of the last suggestion the user actually committed to. Drives variety. */
	lastCommittedEffort: EffortType | null
	/** Reference instant for staleness. Injected so the rule is testable. */
	now: Date
	/** The draw. Same seed + same pool + same history ⇒ same three cards. */
	seed: number
	/**
	 * `activity-weather-dependency` lookup ids that fit today's actual conditions, or `null` when the
	 * signal is unavailable. `null` must never be treated as "nothing matches" — see `useWeatherFit`.
	 */
	weatherMatchIds: readonly number[] | null
}

// --- weights -----------------------------------------------------------------
// Named rather than inlined, because these are the argument. Changing one of them changes what the
// app recommends, which is a product decision and should read like one in the diff.

const ENERGY_EXACT_MATCH = 2
/** Per step the activity is MORE demanding than the user said they are. The expensive mistake. */
const ENERGY_TOO_DEMANDING_PER_STEP = -2.5
/** Per step the activity is LESS demanding. Merely uninspiring, so a much softer penalty. */
const ENERGY_TOO_EASY_PER_STEP = -0.75
/** Full marks for filling the available time, nothing for a rounding error against it. */
const DURATION_FIT_MAX = 2
/** Sources that state no duration sit at the middle of that range rather than losing to it. */
const DURATION_FIT_NEUTRAL = 1
/** A backlog entry whose stated dependency matches today's actual conditions — a happy coincidence. */
const WEATHER_MATCH_BONUS = 1.5
const EFFORT_VARIETY_BONUS = 1
const STALENESS_NEVER_SUGGESTED = 3
const STALENESS_FLOOR = -4
const STALENESS_CEILING = 3
const SOURCE_WEIGHT: Record<SuggestionSource, number> = {
	backlog: 0,
	project: -0.5,
	bucketList: -2,
}
const READINESS_WEIGHT: Record<ReadinessStatus, number> = {
	[ReadinessStatus.ReadyToStart]: 2,
	[ReadinessStatus.Planning]: -1,
	// Never scored — `isEligible` drops it — but the map is total so a new status cannot fall through.
	[ReadinessStatus.NeedsShopping]: 0,
}
/** Step 1 scores 2.5, step 5 scores 0.5: the smallest untried step is the most actionable one. */
const COMFORT_STEP_WEIGHT = 0.5
const JITTER_RANGE = 3

// --- energy ------------------------------------------------------------------

const ENERGY_RANK: Record<EnergyLevel, number> = {
	[EnergyLevel.Low]: 0,
	[EnergyLevel.Medium]: 1,
	[EnergyLevel.High]: 2,
}

/** A project has no energy field; its difficulty is the closest thing the schema records. */
export function difficultyAsEnergy(level: DifficultyLevel): EnergyLevel {
	switch (level) {
		case DifficultyLevel.Beginner:
			return EnergyLevel.Low
		case DifficultyLevel.Expert:
			return EnergyLevel.High
		default:
			return EnergyLevel.Medium
	}
}

/** Same 1/3/5 ramp `comfortZoneColor` walks — a step-5 experience is not a low-energy evening. */
export function comfortStepAsEnergy(step: number): EnergyLevel {
	if (step <= 1) return EnergyLevel.Low
	if (step <= 3) return EnergyLevel.Medium
	return EnergyLevel.High
}

// --- seeded jitter -----------------------------------------------------------

/** FNV-1a. Small, stable across engines, and good enough to decorrelate adjacent keys. */
function hashKey(key: string): number {
	let hash = 0x811c9dc5
	for (let i = 0; i < key.length; i++) {
		hash ^= key.charCodeAt(i)
		hash = Math.imul(hash, 0x01000193)
	}
	return hash >>> 0
}

/** mulberry32, one draw. Deterministic in `(key, seed)` and independent of candidate order. */
function jitterFor(key: string, seed: number): number {
	let state = (hashKey(key) ^ seed) >>> 0
	state = (state + 0x6d2b79f5) >>> 0
	let t = Math.imul(state ^ (state >>> 15), 1 | state)
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// --- the rule ----------------------------------------------------------------

/**
 * Hard constraints. A candidate that fails one is not shown at all, however well it would score:
 * an activity that does not fit the time available is not a suggestion, it is a taunt.
 */
export function isEligible(
	candidate: CandidateFacts,
	constraints: PickerConstraints,
	weatherMatchIds: readonly number[] | null = null,
): boolean {
	if (candidate.minParticipants !== null && candidate.minParticipants > constraints.people) {
		return false
	}
	switch (candidate.source) {
		case 'backlog':
			if (
				candidate.weatherDependencyId !== null &&
				weatherMatchIds !== null &&
				!weatherMatchIds.includes(candidate.weatherDependencyId)
			) {
				return false
			}
			return candidate.statedDurationMinutes === null || candidate.statedDurationMinutes <= constraints.minutes
		case 'project':
			return (
				candidate.readinessStatus !== ReadinessStatus.NeedsShopping &&
				constraints.minutes >= PROJECT_MIN_MINUTES
			)
		case 'bucketList':
			return (
				constraints.minutes >= BUCKET_LIST_MIN_MINUTES &&
				(!candidate.requiresTravel || constraints.minutes >= BUCKET_LIST_TRAVEL_MIN_MINUTES)
			)
	}
}

/** Never book a slot shorter than this — a five-minute block in the planner is noise, not a plan. */
export const MIN_SLOT_MINUTES = 10

/**
 * How long to book for when the user commits. Never longer than they said they had, never longer
 * than the thing is worth, and never so short it is unplannable.
 */
export function slotMinutesFor(candidate: CandidateFacts, constraints: PickerConstraints): number {
	const useful = candidate.maxUsefulMinutes ?? constraints.minutes
	return Math.max(Math.min(useful, constraints.minutes), MIN_SLOT_MINUTES)
}

/** Days since this candidate was last put in front of the user, or `null` if it never was. */
export function daysSinceSuggested(candidate: CandidateFacts, ctx: RankingContext): number | null {
	const raw = ctx.lastSuggestedAt[candidate.key]
	if (raw === undefined) return null
	const at = new Date(raw).getTime()
	if (!Number.isFinite(at)) return null
	return Math.max(0, (ctx.now.getTime() - at) / 86_400_000)
}

function energyFit(candidate: CandidateFacts, constraints: PickerConstraints): number {
	const delta = ENERGY_RANK[candidate.energyLevel] - ENERGY_RANK[constraints.energy]
	if (delta === 0) return ENERGY_EXACT_MATCH
	return delta > 0 ? delta * ENERGY_TOO_DEMANDING_PER_STEP : -delta * ENERGY_TOO_EASY_PER_STEP
}

function durationFit(candidate: CandidateFacts, constraints: PickerConstraints): number {
	if (candidate.statedDurationMinutes === null || constraints.minutes <= 0) return DURATION_FIT_NEUTRAL
	const ratio = Math.min(candidate.statedDurationMinutes / constraints.minutes, 1)
	return DURATION_FIT_MAX * ratio
}

function stalenessScore(candidate: CandidateFacts, ctx: RankingContext): number {
	const days = daysSinceSuggested(candidate, ctx)
	if (days === null) return STALENESS_NEVER_SUGGESTED
	// One point per day back from the floor: shown today is buried, a week ago is as good as new.
	return Math.min(Math.max(STALENESS_FLOOR + days, STALENESS_FLOOR), STALENESS_CEILING)
}

export function scoreCandidate(candidate: CandidateFacts, ctx: RankingContext): number {
	let score = energyFit(candidate, ctx.constraints)
	score += durationFit(candidate, ctx.constraints)
	score += stalenessScore(candidate, ctx)
	score += SOURCE_WEIGHT[candidate.source]

	if (
		candidate.weatherDependencyId !== null &&
		ctx.weatherMatchIds !== null &&
		ctx.weatherMatchIds.includes(candidate.weatherDependencyId)
	) {
		score += WEATHER_MATCH_BONUS
	}
	if (
		candidate.effortType !== null &&
		ctx.lastCommittedEffort !== null &&
		candidate.effortType !== ctx.lastCommittedEffort
	) {
		score += EFFORT_VARIETY_BONUS
	}
	if (candidate.readinessStatus !== null) {
		score += READINESS_WEIGHT[candidate.readinessStatus]
	}
	if (candidate.comfortZoneStep !== null) {
		score += (6 - candidate.comfortZoneStep) * COMFORT_STEP_WEIGHT
	}

	return score + jitterFor(candidate.key, ctx.seed) * JITTER_RANGE
}

/**
 * The draw: filter by the hard constraints, rank by the soft ones, then take three under the source
 * caps — relaxing the caps rather than returning two cards when the eligible pool is thin.
 */
export function pickSuggestions<T extends CandidateFacts>(candidates: readonly T[], ctx: RankingContext): T[] {
	const ranked = candidates
		.filter(candidate => isEligible(candidate, ctx.constraints, ctx.weatherMatchIds))
		.map(candidate => ({ candidate, score: scoreCandidate(candidate, ctx) }))
		.sort((a, b) => b.score - a.score)

	const chosen: T[] = []
	const usedPerSource: Record<SuggestionSource, number> = { backlog: 0, bucketList: 0, project: 0 }

	for (const { candidate } of ranked) {
		if (chosen.length === SUGGESTION_COUNT) break
		if (usedPerSource[candidate.source] >= SOURCE_CAP[candidate.source]) continue
		usedPerSource[candidate.source]++
		chosen.push(candidate)
	}
	// The caps exist to keep the mix interesting, never to cost the user a suggestion.
	for (const { candidate } of ranked) {
		if (chosen.length === SUGGESTION_COUNT) break
		if (!chosen.includes(candidate)) chosen.push(candidate)
	}
	return chosen
}
