import type { Time } from '@/_common/dto/dto/Time.ts'

export interface ITimelineTask {
	startTime: Time
	endTime: Time
	isBackground: boolean
	color: string
}
