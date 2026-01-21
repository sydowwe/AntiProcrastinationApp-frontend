import type {Category} from '@/dtos/response/Category.ts';

export class CategoryRequest {
	constructor(
		public name: string = '',
		public text: string | null = null,
		public color: string | null = null,
		// public icon: string | null = null,
	) {
	}

	static fromEntity(entity: Category) {
		return new CategoryRequest(entity.name, entity.text, entity.color,)
	}
}