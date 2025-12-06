import type {ITextColorResponse} from '@/dtos/response/interface/ITextColorResponse.ts';

export class TaskPriority implements ITextColorResponse {
	constructor(
		public id: number,
		public text: string,
		public color: string,
		public priority: number,
	) {
	}

	static fromJson(json: any): TaskPriority {
		return new TaskPriority(
			json.id,
			json.text,
			json.color,
			json.priority,
		);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => TaskPriority.fromJson(item));
	}
}