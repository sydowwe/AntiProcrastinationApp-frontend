import {ActivityStat} from '@/dtos/response/activityTracking/topDomains/ActivityStat.ts';

export class SummaryCardsData {
	constructor(
		public domain: string,
		public active: ActivityStat | null,
		public background: ActivityStat | null,
		public totalSeconds: number,
		public isNew: boolean
	) {
	}

	static fromJson(json: any): SummaryCardsData {
		return new SummaryCardsData(
			json.domain,
			json.active ? ActivityStat.fromJson(json.active) : null,
			json.background ? ActivityStat.fromJson(json.background) : null,
			json.totalSeconds,
			json.isNew ?? false
		)
	}
}