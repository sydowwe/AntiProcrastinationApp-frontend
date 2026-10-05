import type { DashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'
import type { ActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'

/** `key` is what a click selects and what colour falls back to; `label` is what is printed. */
export interface StackedBarsInputItem extends DashboardItem {
	activeSeconds: number
	backgroundSeconds: number
	color?: string
	url?: string
	/** Which trackers saw the item in this window. Unified bars only. */
	sources?: ActivitySource[]
}

export interface StackedBarsInputWindow {
	windowStart: Date
	windowEnd: Date
	items: StackedBarsInputItem[]
}
