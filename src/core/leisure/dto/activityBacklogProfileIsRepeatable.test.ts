import { describe, expect, it } from 'vitest'
import { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
import { ActivityBacklogProfileRequest } from '@/core/leisure/dto/request/ActivityBacklogProfileRequest.ts'
import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'

/**
 * `isRepeatable` is the entity's column and the one name both sides use. These DTOs spoke `isOneTime`
 * — its inverse — which does not throw on either side, it just silently reads and writes the `bool`
 * default: every row rendered as repeatable and every save landed as one-time.
 */
describe('backlog profile isRepeatable', () => {
	it('reads isRepeatable off the response, and ignores a stray isOneTime', () => {
		expect(ActivityBacklogProfile.fromJson({ isRepeatable: true }).isRepeatable).toBe(true)
		expect(ActivityBacklogProfile.fromJson({ isRepeatable: false }).isRepeatable).toBe(false)
		expect(ActivityBacklogProfile.fromJson({}).isRepeatable).toBe(false)
		expect(ActivityBacklogProfile.fromJson({ isOneTime: true }).isRepeatable).toBe(false)
	})

	it('serialises the request as isRepeatable, which is what the endpoint binds', () => {
		const request = new ActivityBacklogProfileRequest(1, 2, 3, EnergyLevel.Medium, null, 1, null, 4, 60, true)

		const body = JSON.parse(JSON.stringify(request))

		expect(body.isRepeatable).toBe(true)
		expect(body).not.toHaveProperty('isOneTime')
		expect(body.durationMinutes).toBe(60)
	})

	it('round-trips through the request DTO fromJson', () => {
		expect(ActivityBacklogProfileRequest.fromJson({ isRepeatable: true }).isRepeatable).toBe(true)
		expect(ActivityBacklogProfileRequest.fromJson({}).isRepeatable).toBe(false)
	})
})
