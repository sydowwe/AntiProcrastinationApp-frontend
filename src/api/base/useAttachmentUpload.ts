import { ref } from 'vue'
import { API } from '@/plugins/axiosConfig.ts'

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
				headers: { 'Content-Type': 'multipart/form-data' },
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
		uploadAttachment,
	}
}
