import type {IFilterRequest} from '@/dtos/request/interface/IFilterRequest.ts';
import type {Time} from '@/utils/Time.ts';

export class TemplatePlannerTaskFilter implements IFilterRequest {
	constructor(
		public templateId: number,
		public from: Time,
		public until: Time
	) {
	}
}