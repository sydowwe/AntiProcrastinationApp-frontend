import type {IMyResponse} from '@/dtos/response/interface/IMyResponse.ts';

export class TodoListCategoryEntity implements IMyResponse {
	constructor(
		public id: number,
		public name: string,
		public icon: string | null,
		public color: string | null,
	) {}

	static fromJson(json: any) {
		return new TodoListCategoryEntity(json.id, json.name, json.icon ?? null, json.color ?? null)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((o: any) => TodoListCategoryEntity.fromJson(o))
	}
}
