import type {IMyResponse} from '@/dtos/response/interface/IMyResponse.ts';
import {TodoListCategoryEntity} from '@/dtos/response/todoList/TodoListCategoryEntity.ts';

export class TodoListEntity implements IMyResponse {
	constructor(
		public id: number,
		public name: string,
		public icon: string | null,
		public description: string | null,
		public category: TodoListCategoryEntity | null,
	) {}

	static fromJson(json: any) {
		return new TodoListEntity(
			json.id,
			json.name,
			json.icon ?? null,
			json.description ?? null,
			json.category ? TodoListCategoryEntity.fromJson(json.category) : null,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((o: any) => TodoListEntity.fromJson(o))
	}
}
