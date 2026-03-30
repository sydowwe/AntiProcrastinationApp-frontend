import { ref } from 'vue'
import { API } from '@/plugins/axiosConfig.ts'

const isSupported = ref(false)
const isSubscribed = ref(false)
const permission = ref<NotificationPermission>('default')

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = window.atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}

async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
	if (!('serviceWorker' in navigator)) return undefined
	return navigator.serviceWorker.ready
}

async function subscribe(): Promise<boolean> {
	try {
		const reg = await getRegistration()
		if (!reg) return false

		const result = await Notification.requestPermission()
		permission.value = result
		if (result !== 'granted') return false

		const { data } = await API.get<string>('/push/vapid-public-key')
		const applicationServerKey = urlBase64ToUint8Array(data)

		const subscription = await reg.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey,
		})

		await API.post('/push/subscribe', subscription.toJSON())
		isSubscribed.value = true
		return true
	} catch (e) {
		console.error('Push subscription failed:', e)
		return false
	}
}

async function unsubscribe(): Promise<boolean> {
	try {
		const reg = await getRegistration()
		if (!reg) return false

		const subscription = await reg.pushManager.getSubscription()
		if (!subscription) {
			isSubscribed.value = false
			return true
		}

		await API.post('/push/unsubscribe', { endpoint: subscription.endpoint })
		await subscription.unsubscribe()
		isSubscribed.value = false
		return true
	} catch (e) {
		console.error('Push unsubscribe failed:', e)
		return false
	}
}

async function checkSubscription(): Promise<void> {
	const reg = await getRegistration()
	if (!reg) return

	const subscription = await reg.pushManager.getSubscription()
	isSubscribed.value = !!subscription
}

function initPushSupport(): void {
	isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
	permission.value = isSupported.value ? Notification.permission : 'denied'

	if (isSupported.value) {
		checkSubscription()
	}
}

export function usePushNotifications() {
	return {
		isSupported,
		isSubscribed,
		permission,
		subscribe,
		unsubscribe,
		initPushSupport,
	}
}
