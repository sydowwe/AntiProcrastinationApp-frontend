import type {IFilterRequest} from '@/dtos/request/interface/IFilterRequest.ts';

export class TodoListFilter implements IFilterRequest {
	constructor(
		public categoryId: number | null = null,
		public name: string | null = null,
	) {
	}
}
