import type {ICreateRequest} from '@/dtos/request/interface/ICreateRequest.ts';
import type {IUpdateRequest} from '@/dtos/request/interface/IUpdateRequest.ts';
import type {TimePeriodEntity} from '@/dtos/response/activityRecording/TimePeriodEntity.ts';

export class TimePeriodRequest implements ICreateRequest, IUpdateRequest {
	constructor(
		public text: string | null = null,
		public color: string | undefined = undefined,
		public lengthInDays: number = 0,
		public isHidden: boolean = false,
		public streakThreshold: number = 90,
		public streakGraceDays: number = 0,
		public resetAnchorDay: number = 0,
	) {
	}

	static fromEntity(entity: TimePeriodEntity) {
		return new TimePeriodRequest(
			entity.text,
			entity.color,
			entity.lengthInDays,
			entity.isHidden,
			entity.streakThreshold,
			entity.streakGraceDays,
			entity.resetAnchorDay,
		);
	}
}
