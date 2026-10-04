import type { ITextColorResponse } from '@/_common/dto/response/interface/ITextColorResponse.ts'

export class TaskImportance implements ITextColorResponse {
	/**
	 * The `importance` value that marks a user's "optional" row — the server's
	 * `TaskImportance.OptionalMarkerValue`. A task carrying it never counts toward the planner streak
	 * (`PlannerStreakReader`). Every user gets one such row from the default seeder.
	 */
	static readonly OPTIONAL_MARKER = 666

	get isOptionalMarker(): boolean {
		return this.importance === TaskImportance.OPTIONAL_MARKER
	}

	constructor(
		public id: number,
		public text: string,
		public color: string,
		public importance: number,
		public icon: string | null,
	) {}

	static fromJson(json: any): TaskImportance {
		return new TaskImportance(json.id, json.text, json.color, json.importance, json.icon)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => TaskImportance.fromJson(item))
	}
}
