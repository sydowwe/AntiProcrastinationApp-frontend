import { ref } from 'vue'
import { usePushSubscriptionApi } from '@/core/notifications/api/PushNotificationsApi.ts'
import {
	getActiveRegistration,
	isServiceWorkerSupported,
	registerServiceWorker,
} from '@/_common/utils/serviceWorker.ts'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

const { registerPushSubscription, unsubscribePushSubscription } = usePushSubscriptionApi()

const isSupported = ref(false)
const isSubscribed = ref(false)
const permission = ref<NotificationPermission>('default')

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = window.atob(base64)
	const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}

/**
 * Requests permission and subscribes this device to Web Push. Must be triggered from a user
 * gesture (e.g. a button click) — Safari/iOS reject `requestPermission()` otherwise.
 */
async function subscribe(): Promise<boolean> {
	try {
		if (!VAPID_PUBLIC_KEY) {
			console.error('VITE_VAPID_PUBLIC_KEY is not configured')
			return false
		}

		const registration = await getActiveRegistration()
		if (registration === undefined) return false

		permission.value = await Notification.requestPermission()
		if (permission.value !== 'granted') return false

		let subscription = await registration.pushManager.getSubscription()
		if (subscription === null) {
			subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
			})
		}

		const json = subscription.toJSON()
		await registerPushSubscription({
			endpoint: subscription.endpoint,
			p256dh: json.keys?.p256dh ?? '',
			auth: json.keys?.auth ?? '',
			userAgent: navigator.userAgent,
		})
		isSubscribed.value = true
		return true
	} catch (e) {
		console.error('Push subscription failed:', e)
		return false
	}
}

async function unsubscribe(): Promise<boolean> {
	try {
		const registration = await getActiveRegistration()
		if (registration === undefined) return false

		const subscription = await registration.pushManager.getSubscription()
		if (subscription === null) {
			isSubscribed.value = false
			return true
		}

		await unsubscribePushSubscription(subscription.endpoint)
		await subscription.unsubscribe()
		isSubscribed.value = false
		return true
	} catch (e) {
		console.error('Push unsubscribe failed:', e)
		return false
	}
}

async function checkSubscription(): Promise<void> {
	const registration = await getActiveRegistration()
	if (registration === undefined) return

	const subscription = await registration.pushManager.getSubscription()
	isSubscribed.value = subscription !== null
}

async function initPushSupport(): Promise<void> {
	isSupported.value = isServiceWorkerSupported() && 'PushManager' in window && 'Notification' in window
	permission.value = isSupported.value ? Notification.permission : 'denied'
	if (!isSupported.value) return

	await registerServiceWorker()
	await checkSubscription()
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
