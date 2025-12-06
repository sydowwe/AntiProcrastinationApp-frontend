export class ChangeDisplayOrderRequest {
	constructor(
		public movedItemId: number,
		public precedingItemId: number | null = null,
		public followingItemId: number | null = null
	) {}
}
