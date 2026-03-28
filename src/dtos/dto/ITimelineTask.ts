import type {Time} from '@/dtos/dto/Time.ts'

export interface ITimelineTask {
	startTime: Time
	endTime: Time
	isBackground: boolean
	color: string
}
