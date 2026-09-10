import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const BASE_URL = process.env.E2E_BASE_URL ?? 'https://localhost:3000'
// Must match VITE_API_URL in ../.env.development — the app under test talks to this origin.
const API_URL = process.env.E2E_API_URL ?? 'https://localhost:8080'

export { API_URL, BASE_URL }

export default defineConfig({
	testDir: './tests',
	globalSetup: './global-setup.ts',
	workers: 1,
	retries: 0,
	outputDir: './test-results',
	use: {
		baseURL: BASE_URL,
		ignoreHTTPSErrors: true,
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		trace: 'retain-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npm run dev',
		url: BASE_URL,
		// The dev server is HTTPS with a self-signed cert. Without this the readiness probe can never
		// see an already-running server as "up" and every run stalls until the timeout below, even
		// with `reuseExistingServer`. Same cert workaround as `use.ignoreHTTPSErrors` and the request
		// context in global-setup.ts.
		ignoreHTTPSErrors: true,
		reuseExistingServer: true,
		cwd: path.resolve(__dirname, '..'),
		timeout: 60_000,
	},
})
