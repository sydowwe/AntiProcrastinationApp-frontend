import { describe, expect, it } from 'vitest'
import { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
import { WeatherDependencyCode } from '@/core/leisure/dto/enum/WeatherDependencyCode.ts'

/**
 * F64's badge half. The server puts the *None* row in every non-empty weather fit set, so a backlog
 * entry filed under *None* used to be badged "Good weather for this today" and ranked up on any day
 * the account had a weather location. Only a code the server resolved to a real dependency may reach
 * the weather logic.
 */
describe('backlog profile realWeatherDependencyId', () => {
	function row(weatherDependencyCode: unknown) {
		return ActivityBacklogProfile.fromJson({ weatherDependency: { id: 5, text: 'Label' }, weatherDependencyCode })
	}

	it('passes the id through for a real dependency', () => {
		expect(row('sunny').weatherDependencyCode).toBe(WeatherDependencyCode.Sunny)
		expect(row('sunny').realWeatherDependencyId).toBe(5)
		expect(row('dry').realWeatherDependencyId).toBe(5)
		expect(row('snow').realWeatherDependencyId).toBe(5)
	})

	it('hides the id for a None row, whatever its label says', () => {
		expect(row('none').realWeatherDependencyId).toBeNull()
	})

	it('hides the id when the server could not tell what the row means', () => {
		expect(row(null).realWeatherDependencyId).toBeNull()
		expect(ActivityBacklogProfile.fromJson({ weatherDependency: { id: 5 } }).realWeatherDependencyId).toBeNull()
		// A code this client does not know yet is "no opinion", not a dependency.
		expect(row('hail').weatherDependencyCode).toBeNull()
		expect(row('hail').realWeatherDependencyId).toBeNull()
	})
})
