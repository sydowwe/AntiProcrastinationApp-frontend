import type { IFilterRequest } from '@/dtos/request/interface/IFilterRequest.ts'

export class TodoListCategoryFilter implements IFilterRequest {
	constructor(
		public hideEmpty: boolean = false,
		public name: string | null = null,
	) {}
}
