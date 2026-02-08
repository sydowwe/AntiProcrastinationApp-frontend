/**
 * Timeline component types and interfaces
 */

export interface TimelineSession {
	id: number
	domain: string
	url?: string
	startedAt: Date
	endedAt: Date
	durationSeconds: number
	totalSeconds: number
}

export interface StackedSession extends TimelineSession {
	stackLevel: number // 0 = first row, 1 = second row, etc.
}

export interface SessionPosition {
	left: string // CSS left position (px or %)
	width: string // CSS width (px or %)
	minWidth: string // Minimum width for visibility
}

export interface TimelineGridConfig {
	totalMinutes: number // Total duration in minutes (from -> to)
	pixelsPerMinute: number // Calculated based on container width
	laneHeight: number // Height of each lane (Active/Background)
	timeAxisHeight: number // Height of time axis labels
	minBlockWidth: number // Minimum width for any session block (for visibility)
}

export interface Gap {
	startedAt: Date
	endedAt: Date
	durationMinutes: number
}

export interface GapDisplay {
	showLabel: boolean
	displayWidth: number
	compressed: boolean
}

export interface TimeMarker {
	time: Date
	position: string
	label: string
	weight: 'minor' | 'regular' | 'major' // 5min tick | 15/30min label | hour label
}

export type ViewMode = 'single' | 'split'
export type LaneType = 'active' | 'background'
