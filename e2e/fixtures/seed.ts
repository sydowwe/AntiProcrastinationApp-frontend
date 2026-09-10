import fs from 'fs'
import path from 'path'

/**
 * The body of `POST /api/test/seed`, written to disk by `global-setup.ts` and exposed to specs as the
 * `seed` fixture. The backend reference is `docs/e2eTestSeed.md` in the API repo.
 *
 * The ids are a deliberate cross-repo contract and are stable, so hardcoding one is not wrong — but
 * reading them here means a fixture change surfaces as one failure instead of twenty.
 */
export interface SeedUser {
	id: number
	email: string
	password: string
	locale: string
}

export interface SeedResponse {
	fixture: string
	/** UTC date every clock-relative value was computed from. Derive expected dates from THIS, never `new Date()`. */
	seedDateUtc: string
	primaryUser: SeedUser
	secondaryUser: SeedUser
	activities: Record<SeedActivityKey, number>
	todoLists: Record<SeedTodoListKey, number>
	todoListItems: Record<SeedTodoListItemKey, number>
	profiles: Record<SeedProfileKey, number>
	routines: Record<SeedRoutineKey, number>
	/** Keys are verbatim English display text, not camelCase. */
	taskPriorities: Record<string, number>
	/** Keys are verbatim English display text, not camelCase. */
	routineTimePeriods: Record<string, number>
	counts: Record<SeedCountKey, number>
}

export type SeedActivityKey =
	| 'bugFixing'
	| 'featureDevelopment'
	| 'codeReview'
	| 'morningExercise'
	| 'groceryShopping'
	| 'mealPreparation'
	| 'readANovel'
	| 'learnBouldering'
	| 'buildABookshelf'
	| 'archived'
	| 'notDeletable'
	| 'deletable'
	| 'deepCleanKitchen'

export type SeedTodoListKey = 'focus' | 'errands' | 'empty' | 'secondaryWork'

export type SeedTodoListItemKey =
	| 'withEstimate'
	| 'withEstimateAndSteps'
	| 'multiCountPartial'
	| 'completedToday'
	| 'temptationBundled'
	| 'mostOverdue'
	| 'leastOverdue'

export type SeedProfileKey = 'backlog' | 'bucketList' | 'project' | 'memoryAnchor'

export type SeedRoutineKey = 'daily' | 'weekly' | 'monthly'

export type SeedCountKey =
	| 'activities'
	| 'todoListItems'
	| 'overdueTodoListItems'
	| 'calibrationTodoListItems'
	| 'activityHistoryEntries'
	| 'plannerTasks'
	| 'calendars'

const SEED_STATE_FILE = path.resolve(__dirname, '../.state/seed.json')

let cached: SeedResponse | null = null

export function readSeed(): SeedResponse {
	if (cached) return cached
	if (!fs.existsSync(SEED_STATE_FILE)) {
		throw new Error(
			`No seed state at ${SEED_STATE_FILE}. globalSetup writes it after POST /api/test/seed — ` +
				`if it is missing, global setup did not complete.`,
		)
	}
	cached = JSON.parse(fs.readFileSync(SEED_STATE_FILE, 'utf8')) as SeedResponse
	return cached
}

/**
 * A date offset from `seedDateUtc`, in the `dd-MM-yyyy` form the planner routes use.
 *
 * Always derive planner dates from the seed date rather than `new Date()`: the fixture's
 * clock-relative rows were computed at seed time, so a run straddling midnight UTC would otherwise
 * look for tasks on the wrong day.
 */
export function seedDateParam(seed: SeedResponse, dayOffset = 0): string {
	const d = new Date(`${seed.seedDateUtc}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() + dayOffset)
	const dd = String(d.getUTCDate()).padStart(2, '0')
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
	return `${dd}-${mm}-${d.getUTCFullYear()}`
}
