import type {IFilterRequest} from '@/dtos/request/interface/IFilterRequest.ts';
import type {Time} from '@/dtos/dto/Time.ts';

export class TemplatePlannerTaskFilter implements IFilterRequest {
	constructor(
		public templateId: number,
		public from: Time,
		public until: Time
	) {
	}
}