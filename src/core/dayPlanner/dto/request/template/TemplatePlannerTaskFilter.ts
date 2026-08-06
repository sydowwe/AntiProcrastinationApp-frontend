import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'

export class TemplatePlannerTaskFilter implements IFilterRequest {
	constructor(
		public templateId: number,
		public from: Time,
		public until: Time,
	) {}
}
