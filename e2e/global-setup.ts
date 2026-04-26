import { request } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:5000'

export default async function globalSetup() {
	const context = await request.newContext({ baseURL: API_URL })
	try {
		const response = await context.post('/test/seed')
		if (!response.ok()) {
			throw new Error(`Seed endpoint returned HTTP ${response.status()}: ${await response.text()}`)
		}
		console.log(`✓ Test database seeded successfully (${API_URL}/test/seed)`)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
			throw new Error(
				`Cannot reach backend at ${API_URL}/test/seed — make sure the .NET API is running.\n` +
					`Original error: ${message}`,
			)
		}
		throw error
	} finally {
		await context.dispose()
	}
}
