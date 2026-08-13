import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
import type { LookupFilter } from '@/core/leisure/dto/request/LookupFilter.ts'
import { LookupRequest } from '@/core/leisure/dto/request/LookupRequest.ts'

function useLookupApi(entityName: string) {
	const { fetchById, fetchAll } = useEntityQuery<LookupResponse>({
		responseClass: LookupResponse,
		entityName,
	})
	const { create, update, patch, deleteEntity } = useEntityCommand<LookupResponse, LookupRequest, LookupRequest>({
		responseClass: LookupResponse,
		createRequestClass: LookupRequest,
		updateRequestClass: LookupRequest,
		entityName,
	})
	const { fetchFilteredTable } = useFetchFilteredTable<LookupResponse, LookupFilter>({
		responseClass: LookupResponse,
		entityName,
	})

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
