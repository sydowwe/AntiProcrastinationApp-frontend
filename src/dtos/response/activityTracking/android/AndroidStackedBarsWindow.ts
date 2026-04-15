import { AndroidWindowApp } from './AndroidWindowApp.ts'

export class AndroidStackedBarsWindow {
	constructor(
		public windowStart: Date,
		public windowEnd: Date,
		public apps: AndroidWindowApp[],
	) {}

	static fromJson(json: any): AndroidStackedBarsWindow {
		return new AndroidStackedBarsWindow(
			new Date(json.windowStart),
			new Date(json.windowEnd),
			json.apps?.map((a: any) => AndroidWindowApp.fromJson(a)) ?? [],
		)
	}
}
