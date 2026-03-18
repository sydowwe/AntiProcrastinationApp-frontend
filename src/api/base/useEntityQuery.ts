import {ref} from 'vue'
import {SelectOption} from '@/dtos/response/general/SelectOption.ts';
import {API} from '@/plugins/axiosConfig.ts';
import type {IMyResponse} from '@/dtos/response/interface/IMyResponse.ts';

export interface QueryConfig<TResponse> {
	entityName: string
	responseClass: IMyResponse & { fromJson(json: any): TResponse }
}

export function useEntityQuery<TResponse>(
	config: QueryConfig<TResponse>
) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	async function fetchById(id: number): Promise<TResponse> {
		loading.value = true
		error.value = null
		try {
			const response = await API.get(`${config.entityName}/${id}`)
			const entity = config.responseClass.fromJson(response.data)
			return entity
		} catch (e: any) {
			error.value = e.message || `Failed to fetch ${config.entityName} with ID ${id}`
			console.error(`Error fetching ${config.entityName} with ID ${id}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function fetchByField(fieldTitle: string, fieldValue: string | number): Promise<TResponse> {
		loading.value = true
		error.value = null
		try {
			const response = await API.get(`${config.entityName}/by-${fieldTitle}/${fieldValue}`)
			const entity = config.responseClass.fromJson(response.data)
			return entity
		} catch (e: any) {
			error.value = e.message || `Failed to fetch ${config.entityName} by ${fieldTitle}: ${fieldValue}`
			console.error(`Error fetching ${config.entityName} by ${fieldTitle}: ${fieldValue}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function fetchAll(): Promise<TResponse[]> {
		loading.value = true
		error.value = null
		try {
			const response = await API.get(`${config.entityName}`)
			return response.data.map((item: any) => config.responseClass.fromJson(item))
		} catch (e: any) {
			error.value = e.message || `Failed to fetch all ${config.entityName}`
			console.error(`Error fetching all ${config.entityName}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function fetchSelectOptions(): Promise<SelectOption[]> {
		loading.value = true
		error.value = null
		try {
			const response = await API.get(`${config.entityName}/all-options`)
			return SelectOption.listFromJsonList(response.data)
		} catch (e: any) {
			error.value = e.message || `Failed to fetch ${config.entityName} select options`
			console.error(`Error fetching ${config.entityName} select options:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	return {
		loading,
		error,
		fetchById,
		fetchByField,
		fetchAll,
		fetchSelectOptions
	}
}
