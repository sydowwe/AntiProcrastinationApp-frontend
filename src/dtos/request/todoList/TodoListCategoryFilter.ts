import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'

export class TodoListCategoryFilter implements IFilterRequest {
	constructor(
		public hideEmpty: boolean = false,
		public name: string | null = null,
	) {}
}
