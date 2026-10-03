import type { DashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

/** `key` is what a click selects and what colour falls back to; `label` is what is printed. */
export interface StackedBarsInputItem extends DashboardItem {
	activeSeconds: number
	backgroundSeconds: number
	color?: string
	url?: string
}

export interface StackedBarsInputWindow {
	windowStart: Date
	windowEnd: Date
	items: StackedBarsInputItem[]
}
