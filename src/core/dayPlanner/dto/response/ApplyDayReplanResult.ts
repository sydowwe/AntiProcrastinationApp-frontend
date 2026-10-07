/**
 * `POST calendar/day-plan/{date}/replan/apply`: which blocks the re-plan changed (FO4). The day itself
 * is re-read afterwards, so this carries ids only. No postponement count is ever sent.
 */
export class ApplyDayReplanResult {
	constructor(
		public readonly movedTaskIds: number[],
		public readonly movedToTomorrowTaskIds: number[],
		public readonly skippedTaskIds: number[],
	) {}

	static fromJson(json: any): ApplyDayReplanResult {
		const { movedTaskIds = [], movedToTomorrowTaskIds = [], skippedTaskIds = [] } = json ?? {}
		return new ApplyDayReplanResult(movedTaskIds, movedToTomorrowTaskIds, skippedTaskIds)
	}
}
