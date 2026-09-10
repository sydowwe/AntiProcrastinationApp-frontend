import { request } from '@playwright/test'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const API_URL = process.env.E2E_API_URL ?? 'https://localhost:8080'

/**
 * Where the seed response is parked for the specs to read. `seedFixture` in `fixtures/seed.ts` loads
 * it; nothing else should read this path directly.
 */
export const SEED_STATE_FILE = path.resolve(__dirname, '.state/seed.json')

/** Every route in the API is under `/api` (FastEndpoints sets `RoutePrefix = "api"` globally). */
const SEED_PATH = '/api/test/seed'

export default async function globalSetup() {
	// The dev API serves HTTPS with a self-signed certificate, same as the dev server — without this
	// the seed request fails on cert verification before it ever reaches the endpoint.
	const context = await request.newContext({ baseURL: API_URL, ignoreHTTPSErrors: true })
	try {
		const response = await context.post(SEED_PATH)

		if (response.status() === 401) {
			// The API applies an authorization FallbackPolicy, so an unmatched path answers 401 to an
			// anonymous caller rather than 404. The seed route is anonymous when it exists, so a 401
			// here means the route was never registered — the gate is closed, not that we need to log in.
			throw new Error(
				`${SEED_PATH} returned 401, which for this API means the route is NOT REGISTERED.\n` +
					`The endpoint only exists when BOTH hold:\n` +
					`  1. the hosting environment is Development (or explicitly allow-listed), and\n` +
					`  2. the database is on TestSeed:AllowedDatabases (by default localhost / 127.0.0.1 /\n` +
					`     ::1 / host.docker.internal).\n` +
					`The stock dev config points at the SHARED REMOTE database, which is refused by design.\n` +
					`Check the API's startup log — it prints one line either way:\n` +
					`  [WRN] POST ${SEED_PATH} IS ENABLED — environment '...', database '...'\n` +
					`  [INF] POST ${SEED_PATH} is not registered: database '...' is not in TestSeed:AllowedDatabases.`,
			)
		}

		if (!response.ok()) {
			throw new Error(`Seed endpoint returned HTTP ${response.status()}: ${await response.text()}`)
		}

		const body = await response.json()

		// Clear the whole state directory first. It also holds cached storage states, and the seed just
		// wiped every account — a storage state from a previous run points at a user id that no longer
		// exists, so every guarded route would bounce to /login with no obvious cause.
		const stateDir = path.dirname(SEED_STATE_FILE)
		fs.rmSync(stateDir, { recursive: true, force: true })

		// Park the whole response for the specs. Ids are a deliberate cross-repo contract and are stable,
		// but reading them means a fixture change surfaces as one failure instead of twenty.
		fs.mkdirSync(stateDir, { recursive: true })
		fs.writeFileSync(SEED_STATE_FILE, JSON.stringify(body, null, 2), 'utf8')

		console.log(
			`✓ Seeded ${API_URL}${SEED_PATH} — fixture ${body.fixture}, seedDateUtc ${body.seedDateUtc}, ` +
				`${body.counts?.todoListItems ?? '?'} to-do items ` +
				`(${body.counts?.overdueTodoListItems ?? '?'} overdue, ` +
				`${body.counts?.calibrationTodoListItems ?? '?'} with estimates)`,
		)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
			throw new Error(
				`Cannot reach the backend at ${API_URL}${SEED_PATH} — make sure the .NET API is running.\n` +
					`Original error: ${message}`,
			)
		}
		throw error
	} finally {
		await context.dispose()
	}
}
