import { describe, expect, it } from 'vitest'
import {
	backlogFilterUrlState,
	bucketListFilterUrlState,
	memoryAnchorFilterUrlState,
	projectFilterUrlState,
} from '@/core/leisure/composable/leisureFilterUrlState.ts'
import { ActivityBacklogProfileFilter } from '@/core/leisure/dto/request/ActivityBacklogProfileFilter.ts'
import { ActivityBucketListProfileFilter } from '@/core/leisure/dto/request/ActivityBucketListProfileFilter.ts'
import { ActivityProjectProfileFilter } from '@/core/leisure/dto/request/ActivityProjectProfileFilter.ts'
import { MemoryAnchorFilter } from '@/core/leisure/dto/request/MemoryAnchorFilter.ts'
import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'

// Mimics useTableUrlState.syncToUrl: '' deletes the param, anything else sets it.
function toQuery(params: Record<string, string>): Record<string, string> {
	const query: Record<string, string> = {}
	for (const key in params) {
		if (params[key] !== '') query[key] = params[key]
	}
	return query
}

describe('leisure filter URL round-trip', () => {
	it('backlog: every field survives, empties absent', () => {
		const { filterToParams, paramsToFilter } = backlogFilterUrlState()
		const filter = new ActivityBacklogProfileFilter(
			'kayak',
			[1, 2],
			[3],
			[EnergyLevel.Low, EnergyLevel.High],
			[EffortType.Physical],
			[7, 8, 9],
			45,
			2,
			6,
			true,
		)
		const query = toQuery(filterToParams(filter))
		expect(query).toEqual({
			activityName: 'kayak',
			locationTypeIds: '1,2',
			weatherDependencyIds: '3',
			energyLevels: 'low,high',
			effortTypes: 'physical',
			expectedCostTierIds: '7,8,9',
			maxDurationMinutes: '45',
			minParticipants: '2',
			maxParticipants: '6',
			isOneTime: 'true',
		})
		expect(paramsToFilter(query)).toEqual(filter)
	})

	it('backlog: empty filter produces no params at all', () => {
		const { filterToParams, paramsToFilter } = backlogFilterUrlState()
		const empty = new ActivityBacklogProfileFilter()
		expect(toQuery(filterToParams(empty))).toEqual({})
		expect(paramsToFilter({})).toEqual(empty)
	})

	it('tri-state false round-trips, null stays absent', () => {
		const { filterToParams, paramsToFilter } = backlogFilterUrlState()
		const isFalse = new ActivityBacklogProfileFilter()
		isFalse.isOneTime = false
		const query = toQuery(filterToParams(isFalse))
		expect(query).toEqual({ isOneTime: 'false' })
		expect(paramsToFilter(query).isOneTime).toBe(false)

		const isNull = new ActivityBacklogProfileFilter()
		expect(filterToParams(isNull).isOneTime).toBe('')
		expect(paramsToFilter({}).isOneTime).toBeNull()
	})

	it('garbage in the query decodes to null, not NaN or a bogus enum', () => {
		const { paramsToFilter } = backlogFilterUrlState()
		const filter = paramsToFilter({
			locationTypeIds: 'abc,,x',
			energyLevels: 'sideways,low',
			maxDurationMinutes: 'nope',
			isOneTime: 'yes',
		})
		expect(filter.locationTypeIds).toBeNull()
		expect(filter.energyLevels).toEqual([EnergyLevel.Low])
		expect(filter.maxDurationMinutes).toBeNull()
		expect(filter.isOneTime).toBeNull()
	})

	it('bucket list: min/max and tri-state', () => {
		const { filterToParams, paramsToFilter } = bucketListFilterUrlState()
		const filter = new ActivityBucketListProfileFilter('surf', [4], 1, 5, false)
		const query = toQuery(filterToParams(filter))
		expect(query).toEqual({
			activityName: 'surf',
			experienceTypeIds: '4',
			minComfortZoneStep: '1',
			maxComfortZoneStep: '5',
			requiresTravel: 'false',
		})
		expect(paramsToFilter(query)).toEqual(filter)
		// 0 is a real bound, not "absent"
		expect(toQuery(filterToParams(new ActivityBucketListProfileFilter(null, null, 0, null, null)))).toEqual({
			minComfortZoneStep: '0',
		})
	})

	it('project: two enum arrays plus tri-state', () => {
		const { filterToParams, paramsToFilter } = projectFilterUrlState()
		const filter = new ActivityProjectProfileFilter(
			'shed',
			[DifficultyLevel.Beginner, DifficultyLevel.Expert],
			[ReadinessStatus.NeedsShopping],
			'garden',
			true,
		)
		const query = toQuery(filterToParams(filter))
		expect(query).toEqual({
			activityName: 'shed',
			difficultyLevels: 'beginner,expert',
			readinessStatuses: 'needsShopping',
			projectArea: 'garden',
			isMessy: 'true',
		})
		expect(paramsToFilter(query)).toEqual(filter)
	})

	it('memory anchor: all four scalars', () => {
		const { filterToParams, paramsToFilter } = memoryAnchorFilterUrlState()
		const filter = new MemoryAnchorFilter('trip', 2025, 7, 8)
		const query = toQuery(filterToParams(filter))
		expect(query).toEqual({ activityName: 'trip', year: '2025', month: '7', minRating: '8' })
		expect(paramsToFilter(query)).toEqual(filter)
	})

	it('clearing a field emits "" so syncToUrl deletes the stale param', () => {
		const { filterToParams } = memoryAnchorFilterUrlState()
		const params = filterToParams(new MemoryAnchorFilter('trip', null, null, null))
		expect(params).toEqual({ activityName: 'trip', year: '', month: '', minRating: '' })
	})
})
