import type {Category} from '@/dtos/response/Category.ts';

export class CategoryRequest {
	constructor(
		public name: string = '',
		public text: string | null = null,
		public color: string | null = null,
		// public icon: string | null = null,
	) {
	}

	static fromResponse(response: Category) {
		return new CategoryRequest(response.name, response.text, response.color,)
	}
}