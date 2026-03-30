import { DesktopWindowActivity } from './DesktopWindowActivity.ts'

export class DesktopStackedBarsWindow {
	constructor(
		public windowStart: Date,
		public windowEnd: Date,
		public activities: DesktopWindowActivity[],
	) {}

	static fromJson(json: any): DesktopStackedBarsWindow {
		return new DesktopStackedBarsWindow(
			new Date(json.windowStart),
			new Date(json.windowEnd),
			json.activities?.map((a: any) => DesktopWindowActivity.fromJson(a)) || [],
		)
	}
}
