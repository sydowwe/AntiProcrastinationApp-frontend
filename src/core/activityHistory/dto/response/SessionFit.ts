import { Time } from '@/_common/dto/dto/Time.ts'

/**
 * F2-07: a focus length that usually works for one activity, from how its recent timer sessions ended
 * (`GET /activity-history/session/fit`). Both fields are null below five sessions. It carries no completion share on
 * purpose: the chip offers a length, and a share would read as a score of the person.
 */
export class SessionFit {
	constructor(
		/** Whole five-minute steps. */
		public suggestedSeconds: number | null = null,
		public sampleCount: number | null = null,
	) {}

	get suggestedTime(): Time | null {
		return this.suggestedSeconds ? Time.fromSeconds(this.suggestedSeconds) : null
	}

	static fromJson(json: any) {
		const { suggestedSeconds = null, sampleCount = null } = json ?? {}
		return new SessionFit(suggestedSeconds, sampleCount)
	}
}
