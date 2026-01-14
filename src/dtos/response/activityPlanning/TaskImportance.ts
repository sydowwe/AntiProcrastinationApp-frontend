import type {ITextColorResponse} from '@/dtos/response/interface/ITextColorResponse.ts';

export class TaskImportance implements ITextColorResponse {
	constructor(
		public id: number,
		public text: string,
		public color: string,
		public importance: number,
	) {
	}

	static fromJson(json: any): TaskImportance {
		return new TaskImportance(
			json.id,
			json.text,
			json.color,
			json.importance,
		);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => TaskImportance.fromJson(item));
	}
}