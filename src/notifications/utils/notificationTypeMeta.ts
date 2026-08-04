import type { RouteLocationRaw } from 'vue-router'

interface NotificationTypeMeta {
	icon: string
	color?: string
	route?: RouteLocationRaw
}

// Maps a notification `type` enum value to an icon and an optional click-through target.
// The notification text (title/body) is server-rendered — `type` is used only for the
// icon and navigation. Unknown types fall back to the default bell icon and no navigation.
const NOTIFICATION_TYPE_META: Record<string, NotificationTypeMeta> = {
	LeavePending: { icon: 'hourglass-half', color: 'warning', route: { name: 'leaveAdmin' } },
	WorkLogComplianceBreach: { icon: 'triangle-exclamation', color: 'error', route: { name: 'complianceViolations' } },
	LeaveApproved: { icon: 'circle-check', color: 'success' },
	LeaveRejected: { icon: 'circle-xmark', color: 'error' },
}

export function notificationIcon(type: string): string {
	return NOTIFICATION_TYPE_META[type]?.icon ?? 'bell'
}

export function notificationIconColor(type: string): string | undefined {
	return NOTIFICATION_TYPE_META[type]?.color
}

export function notificationRoute(type: string): RouteLocationRaw | undefined {
	return NOTIFICATION_TYPE_META[type]?.route
}
