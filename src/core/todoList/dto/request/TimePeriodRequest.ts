import type { ICreateRequest } from '@/_common/dto/request/interface/ICreateRequest.ts'
import type { IUpdateRequest } from '@/_common/dto/request/interface/IUpdateRequest.ts'
import { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'

export class TimePeriodRequest implements ICreateRequest, IUpdateRequest {
	constructor(
		public text: string | null = null,
		// Required on the wire (`TextColorRequest`): the server answers 400 without it, so a new period
		// starts with a real palette colour and the form's picker offers no "none".
		public color: string = 'blue',
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
