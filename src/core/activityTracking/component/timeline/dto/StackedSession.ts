import { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'

export class StackedSession extends TimelineSessionDto {
	constructor(
		id: number,
		key: string,
		label: string,
		startedAt: Date,
		endedAt: Date,
		durationSeconds: number,
		totalSeconds: number,
		public stackLevel: number, // 0 = first row, 1 = second row, etc.
		url?: string,
	) {
		super(id, key, label, startedAt, endedAt, durationSeconds, totalSeconds, url)
	}
}
