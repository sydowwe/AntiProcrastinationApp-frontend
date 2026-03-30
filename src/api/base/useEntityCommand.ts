import { ref } from 'vue'
import { API } from '@/plugins/axiosConfig.ts'
import type { IMyResponse } from '@/dtos/response/interface/IMyResponse.ts'
import { useEntityQuery } from '@/api/base/useEntityQuery.ts'

export interface CommandConfig<TResponse, TCreateRequest, TUpdateRequest> {
	entityName: string
	responseClass: IMyResponse & { fromJson(json: any): TResponse }
	createRequestClass?: new (...args: any[]) => TCreateRequest
	updateRequestClass?: new (...args: any[]) => TUpdateRequest
}

export function useEntityCommand<TResponse, TCreateRequest, TUpdateRequest>(
	config: CommandConfig<TResponse, TCreateRequest, TUpdateRequest>,
) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	const { fetchById } = useEntityQuery(config)

	async function create(entityData: TCreateRequest): Promise<number> {
		loading.value = true
		error.value = null
		try {
			const createResponse = await API.post(`${config.entityName}`, entityData)

			return createResponse.data
		} catch (e: any) {
			error.value = e.message || `Failed to create ${config.entityName}`
			console.error(`Error creating ${config.entityName}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function createWithResponse(entityData: TCreateRequest): Promise<TResponse> {
		loading.value = true
		error.value = null
		try {
			const createResponse = await API.post(`${config.entityName}`, entityData)

			console.log(createResponse)
			const response = await fetchById(createResponse.data)
			console.log(response)
			return response
		} catch (e: any) {
			error.value = e.message || `Failed to create ${config.entityName}`
			console.error(`Error creating ${config.entityName}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function update(id: number, entityData: TUpdateRequest): Promise<void> {
		loading.value = true
		error.value = null
		try {
			await API.put(`${config.entityName}/${id}`, entityData)

			return Promise.resolve()
		} catch (e: any) {
			error.value = e.message || `Failed to update ${config.entityName} with ID ${id}`
			console.error(`Error updating ${config.entityName} with ID ${id}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function updateWithResponse(id: number, entityData: TUpdateRequest): Promise<TResponse> {
		loading.value = true
		error.value = null
		try {
			await API.put(`${config.entityName}/${id}`, entityData)

			return await fetchById(id)
		} catch (e: any) {
			error.value = e.message || `Failed to update ${config.entityName} with ID ${id}`
			console.error(`Error updating ${config.entityName} with ID ${id}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function patch(id: number, entityData: Partial<TUpdateRequest>): Promise<void> {
		loading.value = true
		error.value = null
		try {
			await API.patch(`${config.entityName}/${id}`, entityData)

			return Promise.resolve()
		} catch (e: any) {
			error.value = e.message || `Failed to patch ${config.entityName} with ID ${id}`
			console.error(`Error patching ${config.entityName} with ID ${id}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function patchWithResponse(id: number, entityData: Partial<TUpdateRequest>): Promise<TResponse> {
		loading.value = true
		error.value = null
		try {
			await API.patch(`${config.entityName}/${id}`, entityData)

			return await fetchById(id)
		} catch (e: any) {
			error.value = e.message || `Failed to patch ${config.entityName} with ID ${id}`
			console.error(`Error patching ${config.entityName} with ID ${id}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function batchedToggle(fieldName: string, ids: number[]): Promise<void> {
		loading.value = true
		error.value = null
		try {
			await API.patch(`${config.entityName}/toggle-${fieldName}`, { ids })
		} catch (e: any) {
			error.value = e.message || `Failed to toggle ${fieldName} for ${config.entityName}s`
			console.error(`Error toggling ${fieldName} for ${config.entityName}s:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function deleteEntity(id: number): Promise<void> {
		loading.value = true
		error.value = null
		try {
			await API.delete(`${config.entityName}/${id}`)
		} catch (e: any) {
			error.value = e.message || `Failed to delete ${config.entityName} with ID ${id}`
			console.error(`Error deleting ${config.entityName} with ID ${id}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	async function batchDelete(ids: number[]): Promise<void> {
		loading.value = true
		error.value = null
		try {
			await API.post(`${config.entityName}/batch-delete`, { ids })
		} catch (e: any) {
			error.value = e.message || `Failed to batch delete ${config.entityName}`
			console.error(`Error batch deleting ${config.entityName}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	return {
		loading,
		error,
		create,
		createWithResponse,
		update,
		updateWithResponse,
		patch,
		patchWithResponse,
		batchedToggle,
		deleteEntity,
		batchDelete,
	}
}
