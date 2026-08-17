import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'

/**
 * "Which month is it now" is an instant read (class 1), so it resolves in the user's zone: these are
 * prefills the user silently accepts and the answer is persisted, and at a month boundary the
 * browser's zone and the user's can name different months.
 */
function currentAnchorMonthYear(): { month: number; year: number } {
	const [year, month] = isoDateInUserZone().split('-').map(Number)
	return { month: month!, year: year! }
}

export class MemoryAnchorRequest {
	constructor(
		public activityId: number = 0,
		public anchorMonth: number = currentAnchorMonthYear().month,
		public anchorYear: number = currentAnchorMonthYear().year,
		public highlightNote: string = '',
		public rating: number = 5,
	) {}

	static fromJson(object: any) {
		const now = currentAnchorMonthYear()
		const {
			activityId = 0,
			anchorMonth = now.month,
			anchorYear = now.year,
			highlightNote = '',
			rating = 5,
		} = object
		return new MemoryAnchorRequest(activityId, anchorMonth, anchorYear, highlightNote, rating)
	}
}
