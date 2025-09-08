import {ref} from 'vue'
import {FilteredTableRequest, type IFilterRequest, type IMyResponse} from '@/classes/Generic.ts';
import {SelectOption} from '@/classes/SelectOption.ts';
import {TableResponse} from '@/classes/Table';
import {API} from '@/plugins/axiosConfig.ts';

// Query composable for read operations
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
			console.log(response.data)
			const entity = config.responseClass.fromJson(response.data)
			console.log(entity)
			return entity
		} catch (e: any) {
			error.value = e.message || `Failed to fetch ${config.entityName} with ID ${id}`
			console.error(`Error fetching ${config.entityName} with ID ${id}:`, e)
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
		fetchAll,
		fetchSelectOptions
	}
}

// Command composable for write operations
export interface CommandConfig<TResponse, TCreateRequest, TUpdateRequest> {
	entityName: string
	responseClass: IMyResponse & { fromJson(json: any): TResponse }
	createRequestClass?: new (...args: any[]) => TCreateRequest
	updateRequestClass?: new (...args: any[]) => TUpdateRequest
}

export function useEntityCommand<TResponse, TCreateRequest, TUpdateRequest>(
	config: CommandConfig<TResponse, TCreateRequest, TUpdateRequest>
) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery(config);

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

			const response = await fetchById(createResponse.data)

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
			const response = await API.put(`${config.entityName}/${id}`, entityData)

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
			const response = await API.put(`${config.entityName}/${id}`, entityData)
			const updatedItem = await fetchById(id)

			return updatedItem;
		} catch (e: any) {
			error.value = e.message || `Failed to update ${config.entityName} with ID ${id}`
			console.error(`Error updating ${config.entityName} with ID ${id}:`, e)
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

	return {
		loading,
		error,
		create,
		createWithResponse,
		update,
		updateWithResponse,
		deleteEntity,
		fetchById,
		fetchAll,
		fetchSelectOptions
	}
}

export function useAttachmentUpload(entityName: string) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	async function uploadAttachment(entityId: number, file: File): Promise<any> {
		loading.value = true
		error.value = null
		try {
			const formData = new FormData()
			formData.append('file', file)
			const response = await API.post(`/${entityName}/${entityId}/attachments`, formData, {
				headers: {'Content-Type': 'multipart/form-data'}
			})
			const newAttachment = response.data
			return newAttachment
		} catch (e: any) {
			error.value = e.message || `Failed to upload attachment to ${entityName} with ID ${entityId}`
			console.error(`Error uploading attachment to ${entityName} with ID ${entityId}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	return {
		loading,
		error,
		uploadAttachment
	}
}

// Separate composable for filtered table functionality
export function useFilteredTable<TTableResponse extends IMyResponse, TFilter extends IFilterRequest>(
	tableResponseClass: IMyResponse & { fromJson(json: any): TTableResponse },
	entityName: string,
) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	async function fetchFilteredTable(request: FilteredTableRequest<TFilter>): Promise<TableResponse<TTableResponse>> {
		loading.value = true
		error.value = null
		try {
			const response = await API.post(`/${entityName}/filtered-table`, request)
			return new TableResponse(response.data.items.map((r: any) => tableResponseClass.fromJson(r)), response.data.itemsCount)
		} catch (e: any) {
			error.value = e.message || `Failed to fetch filtered ${entityName} table`
			console.error(`Error fetching filtered ${entityName} table:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	return {
		loading,
		error,
		fetchFilteredTable
	}
}
