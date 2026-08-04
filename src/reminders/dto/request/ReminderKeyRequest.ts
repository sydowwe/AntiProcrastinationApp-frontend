/**
 * The stable 4-part key identifying a reminder. Sent in the body of the pause / resume / cancel
 * (and register) endpoints. All four parts together are unique.
 */
export class ReminderKeyRequest {
	constructor(
		public ownerModule: string,
		public subjectType: string,
		public subjectId: number,
		public kind: string,
	) {}
}
