// Type definitions
export interface TimeSlot {
	hour: number
	minute: number
}

export interface Category {
	label: string
	value: string
	color: string
}

export interface DayEvent {
	id: number
	title: string
	start: string
	end: string
	category?: string
}

export interface EditingEvent {
	id: number | null
	title: string
	startTime: string
	endTime: string
	category: string
}

export interface CreationPreview {
	startRow: number
	endRow: number
}

export interface PrefillTimes {
	startTime: string
	endTime: string
}