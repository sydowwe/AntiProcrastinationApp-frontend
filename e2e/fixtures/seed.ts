import { request } from '@playwright/test'
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
	/** Added in `e2e-v2`. `pinned` is the only one with `isPinned` set — see {@link SeedDayPlannerTemplateKey}. */
	dayPlannerTemplates: Record<SeedDayPlannerTemplateKey, number>
	/** Added in `e2e-v2`. Existing desktop/Android pattern mappings, for the *Mappings* tab. */
	trackingMappings: Record<SeedTrackingMappingKey, number>
	/** Added in `e2e-v2`. */
	notifications: Record<SeedNotificationKey, number>
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

/**
 * `memoryAnchorOnArchived` is the anchor whose activity is archived. It is the case that separates
 * `memory-anchor` from the three `Activity*Profile` grids: the anchor keeps its row and its name, while
 * an archived activity removes a backlog/bucket-list/project row entirely. The fixture has returned it
 * since `e2e-v2`; it was simply missing from this union.
 */
export type SeedProfileKey =
	| 'backlog'
	| 'bucketList'
	| 'project'
	| 'memoryAnchor'
	| 'memoryAnchorOnArchived'

export type SeedRoutineKey = 'daily' | 'weekly' | 'monthly'

/**
 * `homeOffice` (5 tasks) and `officeDay` (4) are the two the split/compare view needs; `pinned`
 * (3 tasks, `Relaxed Weekend`) is the only one with `isPinned` set, so it is the only way to reach the
 * template list's pinned section. None of the twelve seeded tasks is a background task.
 */
export type SeedDayPlannerTemplateKey = 'homeOffice' | 'officeDay' | 'pinned'

export type SeedTrackingMappingKey =
	| 'desktopToActivity'
	| 'desktopIgnored'
	| 'androidToActivity'
	| 'androidIgnored'

export type SeedNotificationKey = 'newestUnread' | 'oldestRead' | 'secondaryNewest'

export type SeedCountKey =
	| 'activities'
	| 'todoListItems'
	| 'overdueTodoListItems'
	| 'calibrationTodoListItems'
	| 'activityHistoryEntries'
	| 'plannerTasks'
	| 'calendars'
	// --- added in `e2e-v2` ---
	| 'dayPlannerTemplates'
	| 'templatePlannerTasks'
	| 'webExtensionEntries'
	| 'desktopEntries'
	/** `(productName, processName, windowTitle)` groups, NOT the entry count — what the grid paginates. */
	| 'distinctDesktopEntries'
	| 'androidSessions'
	| 'distinctAndroidEntries'
	| 'notifications'
	/** Strictly smaller than `notifications`, which is what makes the bell's All/Unread filter testable. */
	| 'unreadNotifications'

/**
 * The fixture version this suite is written against, checked against `fixture` in the response by
 * `global-setup.ts`.
 *
 * The API bumps `E2eFixtureIds.FixtureVersion` whenever the fixture changes shape in a way a spec
 * could notice. Without this check that bump reaches us as twenty unrelated spec failures; with it,
 * it is one failure in global setup that says what actually happened. Bump this only together with
 * reading the API's `docs/e2eTestSeed.md` for what moved.
 */
export const EXPECTED_FIXTURE_VERSION = 'e2e-v2'

/** Every route in the API is under `/api` (FastEndpoints sets `RoutePrefix = "api"` globally). */
export const SEED_PATH = '/api/test/seed'

/** Where `global-setup.ts` parks the seed response. Nothing outside this module should read the path. */
export const SEED_STATE_FILE = path.resolve(__dirname, '../.state/seed.json')

/**
 * Read lazily rather than captured at module load: `global-setup.ts` imports this module, and ES
 * imports are evaluated *before* its `dotenv.config()` call runs, so a top-level const here would be
 * fixed to the default before `.env.test` was ever read.
 */
export function apiUrl(): string {
	return process.env.E2E_API_URL ?? 'https://localhost:8080'
}

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
 * `POST /api/test/seed`, with the diagnostics for the two ways it fails that are not about the data.
 * Shared by `global-setup.ts` and `reseed` so the failure text exists once.
 */
export async function postSeed(): Promise<SeedResponse> {
	const baseURL = apiUrl()
	// The dev API serves HTTPS with a self-signed certificate, same as the dev server — without this
	// the seed request fails on cert verification before it ever reaches the endpoint.
	const context = await request.newContext({ baseURL, ignoreHTTPSErrors: true })
	try {
		const response = await context.post(SEED_PATH)

		if (response.status() === 401) {
			// The API applies an authorization FallbackPolicy, and ASP.NET applies the fallback to
			// requests matching NO endpoint too — so an unmatched path answers 401 to an anonymous
			// caller rather than 404. The seed route is anonymous when it exists, so a 401 here means
			// the route was never registered: the gate is closed, not that we need to log in.
			throw new Error(
				`${SEED_PATH} returned 401, which for this API means the route is NOT REGISTERED.\n` +
					`The endpoint only exists when BOTH hold:\n` +
					`  1. the hosting environment is Development (or named in TestSeed:AllowedEnvironments;\n` +
					`     Production and Staging are refused even when named), and\n` +
					`  2. DB_HOST is a database on THIS machine — localhost, anything in 127.0.0.0/8, ::1,\n` +
					`     or host.docker.internal. DB_PORT and DB_NAME are not consulted, and there is NO\n` +
					`     configuration key that admits a remote host. A hostname that is not a known local\n` +
					`     name is refused, not resolved.\n` +
					`The stock dev config points at the SHARED REMOTE database, which is refused by design —\n` +
					`on both the dev and the prod port, since the gate does not look at the port. Point the\n` +
					`API at a local Postgres to run e2e; there is no other way in.\n` +
					`Check the API's startup log, which prints one line either way:\n` +
					`  [WRN] POST ${SEED_PATH} IS ENABLED — environment 'Development', database host 'localhost'.\n` +
					`  [INF] POST ${SEED_PATH} is not registered: the database host '...' is not this machine.`,
			)
		}

		if (!response.ok()) {
			throw new Error(`Seed endpoint returned HTTP ${response.status()}: ${await response.text()}`)
		}

		const body = (await response.json()) as SeedResponse

		if (body.fixture !== EXPECTED_FIXTURE_VERSION) {
			throw new Error(
				`Fixture version mismatch: the API seeded '${body.fixture}', this suite is written against ` +
					`'${EXPECTED_FIXTURE_VERSION}'.\n` +
					`The API bumps E2eFixtureIds.FixtureVersion when the fixture changes shape in a way a spec ` +
					`could notice. Read its docs/e2eTestSeed.md for what moved, update the specs, then update ` +
					`EXPECTED_FIXTURE_VERSION in e2e/fixtures/seed.ts.`,
			)
		}

		return body
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
			throw new Error(
				`Cannot reach the backend at ${baseURL}${SEED_PATH} — make sure the .NET API is running.\n` +
					`Original error: ${message}`,
			)
		}
		throw error
	} finally {
		await context.dispose()
	}
}

/** Parks the response for the specs and refreshes this module's cache. */
export function writeSeedState(body: SeedResponse): void {
	fs.mkdirSync(path.dirname(SEED_STATE_FILE), { recursive: true })
	fs.writeFileSync(SEED_STATE_FILE, JSON.stringify(body, null, 2), 'utf8')
	cached = body
}

/**
 * Re-runs the reset mid-suite, for a spec that mutates fixture rows.
 *
 * Reach for this only when the mutation is on a row the fixture pins and other specs read — the
 * counter on `todoListItems.multiCountPartial` is the example: assert on it once and it is no longer
 * at 2 of 5 for anyone, including a re-run of the same spec. The cheaper answer, and the first one to
 * try, is to create the row you are about to mutate through the app's own API and leave the fixture
 * alone.
 *
 * Costs a full truncate-and-rebuild (~1.5–2.0 s) per call. Safe to call repeatedly: the endpoint is a
 * reset, not an upsert, and the API's `Seed_Twice_LeavesIdenticalRows` pins that twice equals once.
 *
 * Cached auth survives it. The accounts come back with the same ids and the seeder writes a
 * deterministic security stamp, and this solution installs no `SecurityStampValidator` and no
 * `OnTokenValidated` hook — so a token issued before the reset still authenticates after it. Only
 * `global-setup.ts` clears `.state/`, and it does that because a storage state left by a *previous
 * run* may predate an id change.
 */
export async function reseed(): Promise<SeedResponse> {
	const body = await postSeed()
	writeSeedState(body)
	return body
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
