import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'

export class NameTextFilter implements IFilterRequest {
	constructor(
		public name: string | null = null,
		public text: string | null = null,
	) {}
}
