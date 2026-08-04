import { computed, ref } from 'vue'
import { type HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { NotificationResponse } from '@/core/notifications/dto/NotificationResponse.ts'
import { useNotificationApi } from '@/core/notifications/api/NotificationApi.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

const HUB_URL = `${import.meta.env.VITE_API_URL}/hubs/notifications`

const notifications = ref<NotificationResponse[]>([])
const isConnected = ref(false)
const isLoading = ref(false)

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)
const { showSnackbar } = useSnackbar()
const { fetchMyNotifications, markNotificationRead } = useNotificationApi()

let connection: HubConnection | null = null

async function loadNotifications(): Promise<void> {
	isLoading.value = true
	try {
		notifications.value = await fetchMyNotifications()
	} catch (e) {
		console.error('Failed to load notifications:', e)
	} finally {
		isLoading.value = false
	}
}

function handleIncoming(json: any): void {
	const notification = NotificationResponse.fromJson(json)
	// Replace if it already exists (refresh), otherwise prepend.
	const existingIndex = notifications.value.findIndex(n => n.id === notification.id)
	if (existingIndex === -1) {
		notifications.value.unshift(notification)
	} else {
		notifications.value[existingIndex] = notification
	}

	const message = notification.body ? `${notification.title} — ${notification.body}` : notification.title
	showSnackbar(message, { color: 'primary' })
}

async function markRead(id: number): Promise<void> {
	const notification = notifications.value.find(n => n.id === id)
	if (notification === undefined || notification.isRead) return

	// Optimistic update; revert on failure.
	notification.isRead = true
	try {
		await markNotificationRead(id)
	} catch (e) {
		notification.isRead = false
		console.error('Failed to mark notification as read:', e)
	}
}

async function markAllRead(): Promise<void> {
	const unread = notifications.value.filter(n => !n.isRead)
	await Promise.all(unread.map(n => markRead(n.id)))
}

async function connect(): Promise<void> {
	if (connection !== null) return

	connection = new HubConnectionBuilder()
		.withUrl(HUB_URL, {
			withCredentials: true, // sends the httpOnly auth-token cookie on the handshake
		})
		.withAutomaticReconnect()
		.configureLogging(LogLevel.Warning)
		.build()

	connection.on('ReceiveNotification', handleIncoming)
	connection.onreconnected(() => {
		isConnected.value = true
		loadNotifications()
	})
	connection.onclose(() => {
		isConnected.value = false
	})

	try {
		await connection.start()
		isConnected.value = true
		await loadNotifications()
	} catch (e) {
		console.error('Notification hub connection failed:', e)
		connection = null
	}
}

async function disconnect(): Promise<void> {
	if (connection === null) return
	try {
		if (connection.state !== HubConnectionState.Disconnected) {
			await connection.stop()
		}
	} catch (e) {
		console.error('Notification hub disconnect failed:', e)
	} finally {
		connection = null
		isConnected.value = false
		notifications.value = []
	}
}

export function useNotifications() {
	return {
		notifications,
		unreadCount,
		isConnected,
		isLoading,
		connect,
		disconnect,
		loadNotifications,
		markRead,
		markAllRead,
	}
}
