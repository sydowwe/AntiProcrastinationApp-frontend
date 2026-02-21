export interface StackedBarsInputItem {
	name: string
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
