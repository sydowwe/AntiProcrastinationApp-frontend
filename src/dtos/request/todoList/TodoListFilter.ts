import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'

export class TodoListFilter implements IFilterRequest {
	constructor(
		public categoryId: number | null = null,
		public name: string | null = null,
	) {}
}
