import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { apiUrl, postSeed, SEED_PATH, SEED_STATE_FILE, writeSeedState } from './fixtures/seed'

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

/**
 * Where the seed response is parked for the specs to read. Re-exported for continuity; it is defined
 * in `fixtures/seed.ts`, which is also the only module that should read the path.
 */
export { SEED_STATE_FILE }

/**
 * Resets the API's database to the fixture, once, before any spec and before any login.
 *
 * The request itself, its two failure diagnostics and the fixture-version check live in
 * `fixtures/seed.ts`, because `reseed()` needs the same ones mid-run. What stays here is only what is
 * specific to *starting* a run: clearing stale state, and reporting what landed.
 */
export default async function globalSetup() {
	const body = await postSeed()

	// Clear the whole state directory first. It also holds cached storage states, and the seed just
	// wiped every account — a storage state from a previous run points at a user id that no longer
	// exists, so every guarded route would bounce to /login with no obvious cause.
	fs.rmSync(path.dirname(SEED_STATE_FILE), { recursive: true, force: true })

	// Park the whole response for the specs. Ids are a deliberate cross-repo contract and are stable,
	// but reading them means a fixture change surfaces as one failure instead of twenty.
	writeSeedState(body)

	console.log(
		`✓ Seeded ${apiUrl()}${SEED_PATH} — fixture ${body.fixture}, seedDateUtc ${body.seedDateUtc}, ` +
			`${body.counts?.todoListItems ?? '?'} to-do items ` +
			`(${body.counts?.overdueTodoListItems ?? '?'} overdue, ` +
			`${body.counts?.calibrationTodoListItems ?? '?'} with estimates)`,
	)
}
