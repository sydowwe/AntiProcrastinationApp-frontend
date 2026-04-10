import type { ICreateRequest } from '@/dtos/request/interface/ICreateRequest.ts'
import type { IUpdateRequest } from '@/dtos/request/interface/IUpdateRequest.ts'
import { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'

export class TimePeriodRequest implements ICreateRequest, IUpdateRequest {
	constructor(
		public text: string | null = null,
		public color: string | undefined = undefined,
		public lengthInDays: number = 7,
		public isHidden: boolean = false,
		public streakThreshold: number = 90,
		public streakGraceDays: number = 0,
		public resetAnchorDay: number = 0,
		public historyDepth: number = RoutineTimePeriodEntity.defaultHistoryDepth(7),
	) {}

	static fromEntity(entity: RoutineTimePeriodEntity) {
		return new TimePeriodRequest(
			entity.text,
			entity.color,
			entity.lengthInDays,
			entity.isHidden,
			entity.streakThreshold,
			entity.streakGraceDays,
			entity.resetAnchorDay,
			entity.historyDepth,
		)
	}
}
