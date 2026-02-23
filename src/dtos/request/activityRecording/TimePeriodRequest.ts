import type {ICreateRequest} from '@/dtos/request/interface/ICreateRequest.ts';
import type {IUpdateRequest} from '@/dtos/request/interface/IUpdateRequest.ts';

export class TimePeriodRequest implements ICreateRequest, IUpdateRequest {
	constructor(
		public text: string | null = null,
		public color: string | undefined = undefined,
		public lengthInDays: number = 0,
		public isHidden: boolean = false,
	) {
	}
}
