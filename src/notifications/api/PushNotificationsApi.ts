import { API } from '@/_common/axiosConfig.ts'

export interface PushSubscriptionPayload {
	endpoint: string
	p256dh: string
	auth: string
	userAgent?: string
}

export function usePushSubscriptionApi() {
	async function registerPushSubscription(payload: PushSubscriptionPayload): Promise<void> {
		await API.post('/push-subscription', payload)
	}

	async function unsubscribePushSubscription(endpoint: string): Promise<void> {
		await API.post('/push-subscription/unsubscribe', { endpoint })
	}

	return { registerPushSubscription, unsubscribePushSubscription }
}
