import type { TableUrlStateOptions } from '@/_common/composable/table/useTableUrlState.ts'
import { ActivityBacklogProfileFilter } from '@/core/leisure/dto/request/ActivityBacklogProfileFilter.ts'
import { ActivityBucketListProfileFilter } from '@/core/leisure/dto/request/ActivityBucketListProfileFilter.ts'
import { ActivityProjectProfileFilter } from '@/core/leisure/dto/request/ActivityProjectProfileFilter.ts'
import { MemoryAnchorFilter } from '@/core/leisure/dto/request/MemoryAnchorFilter.ts'
import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
import {
	decodeEnumList,
	decodeNumber,
	decodeNumberList,
	decodeText,
	decodeTriState,
	encodeEnumList,
	encodeNumber,
	encodeNumberList,
	encodeText,
	encodeTriState,
} from '@/core/leisure/composable/filterUrlParams.ts'

// One `{ defaultFilter, filterToParams, paramsToFilter }` triple per leisure table, ready to spread
// into `useServerTable`. Each pair covers EVERY field of its filter — a field that round-trips only
// one way is worse than none, because the chip stays visible while the request no longer carries it.
//
// `filterToParams` must return a key for every field on every call, including the absent ones as ''
// — that is how a cleared field gets deleted from the query rather than left behind.

export function backlogFilterUrlState(): TableUrlStateOptions<ActivityBacklogProfileFilter> {
	return {
		defaultFilter: new ActivityBacklogProfileFilter(),
		filterToParams: filter => ({
			activityName: encodeText(filter.activityName),
			locationTypeIds: encodeNumberList(filter.locationTypeIds),
			weatherDependencyIds: encodeNumberList(filter.weatherDependencyIds),
			energyLevels: encodeEnumList(filter.energyLevels),
			effortTypes: encodeEnumList(filter.effortTypes),
			expectedCostTierIds: encodeNumberList(filter.expectedCostTierIds),
			maxDurationMinutes: encodeNumber(filter.maxDurationMinutes),
			minParticipants: encodeNumber(filter.minParticipants),
			maxParticipants: encodeNumber(filter.maxParticipants),
			isOneTime: encodeTriState(filter.isOneTime),
			isAnchored: encodeTriState(filter.isAnchored),
		}),
		paramsToFilter: params =>
			new ActivityBacklogProfileFilter(
				decodeText(params.activityName),
				decodeNumberList(params.locationTypeIds),
				decodeNumberList(params.weatherDependencyIds),
				decodeEnumList(params.energyLevels, EnergyLevel),
				decodeEnumList(params.effortTypes, EffortType),
				decodeNumberList(params.expectedCostTierIds),
				decodeNumber(params.maxDurationMinutes),
				decodeNumber(params.minParticipants),
				decodeNumber(params.maxParticipants),
				decodeTriState(params.isOneTime),
				decodeTriState(params.isAnchored),
			),
	}
}

export function bucketListFilterUrlState(): TableUrlStateOptions<ActivityBucketListProfileFilter> {
	return {
		defaultFilter: new ActivityBucketListProfileFilter(),
		filterToParams: filter => ({
			activityName: encodeText(filter.activityName),
			experienceTypeIds: encodeNumberList(filter.experienceTypeIds),
			minComfortZoneStep: encodeNumber(filter.minComfortZoneStep),
			maxComfortZoneStep: encodeNumber(filter.maxComfortZoneStep),
			requiresTravel: encodeTriState(filter.requiresTravel),
			isAnchored: encodeTriState(filter.isAnchored),
		}),
		paramsToFilter: params =>
			new ActivityBucketListProfileFilter(
				decodeText(params.activityName),
				decodeNumberList(params.experienceTypeIds),
				decodeNumber(params.minComfortZoneStep),
				decodeNumber(params.maxComfortZoneStep),
				decodeTriState(params.requiresTravel),
				decodeTriState(params.isAnchored),
			),
	}
}

export function projectFilterUrlState(): TableUrlStateOptions<ActivityProjectProfileFilter> {
	return {
		defaultFilter: new ActivityProjectProfileFilter(),
		filterToParams: filter => ({
			activityName: encodeText(filter.activityName),
			difficultyLevels: encodeEnumList(filter.difficultyLevels),
			readinessStatuses: encodeEnumList(filter.readinessStatuses),
			projectArea: encodeText(filter.projectArea),
			isMessy: encodeTriState(filter.isMessy),
		}),
		paramsToFilter: params =>
			new ActivityProjectProfileFilter(
				decodeText(params.activityName),
				decodeEnumList(params.difficultyLevels, DifficultyLevel),
				decodeEnumList(params.readinessStatuses, ReadinessStatus),
				decodeText(params.projectArea),
				decodeTriState(params.isMessy),
			),
	}
}

export function memoryAnchorFilterUrlState(): TableUrlStateOptions<MemoryAnchorFilter> {
	return {
		defaultFilter: new MemoryAnchorFilter(),
		filterToParams: filter => ({
			activityName: encodeText(filter.activityName),
			year: encodeNumber(filter.year),
			month: encodeNumber(filter.month),
			minRating: encodeNumber(filter.minRating),
		}),
		paramsToFilter: params =>
			new MemoryAnchorFilter(
				decodeText(params.activityName),
				decodeNumber(params.year),
				decodeNumber(params.month),
				decodeNumber(params.minRating),
			),
	}
}
