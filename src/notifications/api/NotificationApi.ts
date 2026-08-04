import { API } from '@/_common/axiosConfig.ts'
import { NotificationResponse } from '@/core/notifications/dto/NotificationResponse.ts'

export function useNotificationApi() {
	async function fetchMyNotifications(): Promise<NotificationResponse[]> {
		const response = await API.get<any[]>('/notification/mine')
		return NotificationResponse.listFromObjects(response.data)
	}

	async function markNotificationRead(id: number): Promise<void> {
		await API.patch(`/notification/${id}/read`)
	}

	return { fetchMyNotifications, markNotificationRead }
}
