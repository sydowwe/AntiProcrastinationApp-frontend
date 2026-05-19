export class MemoryAnchorRequest {
	constructor(
		public activityId: number = 0,
		public anchorMonth: number = new Date().getMonth() + 1,
		public anchorYear: number = new Date().getFullYear(),
		public highlightNote: string = '',
		public rating: number = 5,
	) {}

	static fromJson(object: any) {
		const now = new Date()
		const {
			activityId = 0,
			anchorMonth = now.getMonth() + 1,
			anchorYear = now.getFullYear(),
			highlightNote = '',
			rating = 5,
		} = object
		return new MemoryAnchorRequest(activityId, anchorMonth, anchorYear, highlightNote, rating)
	}
}
