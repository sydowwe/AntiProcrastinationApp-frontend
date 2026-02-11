import {WindowActivity} from '@/dtos/response/activityTracking/stackedBars/WindowActivity.ts';

export class ActivityWindow {
	constructor(
		public windowStart: Date,
		public windowEnd: Date,
		public activities: WindowActivity[]
	) {
	}

	static fromJson(json: any): ActivityWindow {
		return new ActivityWindow(
			new Date(json.windowStart),
			new Date(json.windowEnd),
			json.activities?.map((a: any) => WindowActivity.fromJson(a)) || []
		)
	}
}