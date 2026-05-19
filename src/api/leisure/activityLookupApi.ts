import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/api/base/fetchFilteredTable.ts'
import { LookupResponse } from '@/dtos/response/general/LookupResponse.ts'
import type { LookupFilter } from '@/dtos/request/general/LookupFilter.ts'

function useLookupApi(entityName: string) {
	const { fetchById, fetchAll } = useEntityQuery<LookupResponse>({
		responseClass: LookupResponse,
		entityName,
	})
	const { create, update, patch, deleteEntity } = useEntityCommand<LookupResponse, any, any>({
		responseClass: LookupResponse,
		entityName,
	})
	const { fetchFilteredTable } = useFetchFilteredTable<LookupResponse, LookupFilter>(LookupResponse, entityName)

	return { fetchById, fetchAll, create, update, patch, deleteEntity, fetchFilteredTable }
}

export function useActivityLocationTypeApi() {
	return useLookupApi('activity-location-type')
}

export function useActivityWeatherDependencyApi() {
	return useLookupApi('activity-weather-dependency')
}

export function useActivityExperienceTypeApi() {
	return useLookupApi('activity-experience-type')
}

export function useActivityExpectedCostTierApi() {
	return useLookupApi('activity-expected-cost-tier')
}
