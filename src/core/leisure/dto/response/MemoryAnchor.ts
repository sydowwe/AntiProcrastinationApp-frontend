import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
import { ActivityInfo } from '@/core/leisure/dto/response/ActivityInfo.ts'

export class MemoryAnchor implements IIdResponse {
	constructor(
		public id: number,
		public activityId: number,
		public activity: ActivityInfo,
		public anchorMonth: number,
		public anchorYear: number,
		public highlightNote: string,
		public rating: number,
		public hasBacklog: boolean,
		/**
		 * `null` when `hasBacklog` is false — "is the backlog entry repeatable" has no answer when there is
		 * no entry, and `false` there would read as "it is one-time". Only a non-repeatable entry is closed
		 * by being anchored, so the Source column tests `=== false`, not truthiness.
		 */
		public backlogIsRepeatable: boolean | null,
		public hasBucketList: boolean,
	) {}

	get periodKey(): number {
		return this.anchorYear * 100 + this.anchorMonth
	}

	static fromJson(object: any) {
		const {
			id = 0,
			activityId = 0,
			activity = {},
			anchorMonth = 1,
			anchorYear = new Date().getFullYear(),
			highlightNote = '',
			rating = 0,
			hasBacklog = false,
			backlogIsRepeatable = null,
			hasBucketList = false,
		} = object
		return new MemoryAnchor(
			id,
			activityId,
			ActivityInfo.fromJson(activity),
			anchorMonth,
			anchorYear,
			highlightNote,
			rating,
			hasBacklog,
			backlogIsRepeatable,
			hasBucketList,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => MemoryAnchor.fromJson(item))
	}
}
