import {Activity} from '@/dtos/response/Activity';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import type {IBaseToDoListItem} from '@/dtos/response/interface/IBaseToDoListItem.ts';

export class TodoListItemEntity implements IBaseToDoListItem {
	constructor(
		public id: number,
		public activity: Activity,
		public isDone: boolean,
		public doneCount: number | null,
		public totalCount: number | null,
		public taskPriority: TaskPriority,
	) {
	}

	get isMultipleCount() {
		return !!this.totalCount && this.totalCount !== 1;
	}

	static fromJson(json: any) {
		return new TodoListItemEntity(
			json.id,
			Activity.fromJson(json.activity),
			json.isDone,
			json.doneCount,
			json.totalCount,
			TaskPriority.fromJson(json.taskPriority)
		);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}

	static frontEndSortFunction() {
		return (a: TodoListItemEntity, b: TodoListItemEntity) => {
			const priorityComparison = a.taskPriority.priority - b.taskPriority.priority;
			return priorityComparison !== 0 ? priorityComparison : a.id - b.id;
		};
	}
}
