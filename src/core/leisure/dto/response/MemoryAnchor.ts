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
		public backlogIsOneTime: boolean,
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
			backlogIsOneTime = false,
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
			backlogIsOneTime,
			hasBucketList,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => MemoryAnchor.fromJson(item))
	}
}
