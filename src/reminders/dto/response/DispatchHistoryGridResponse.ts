import { IdResponse } from '@/_common/dto/response/base/IdResponse.ts'
import type { DispatchOutcome } from '../enum/DispatchOutcome.ts'
import type { SkipReason } from '../enum/SkipReason.ts'

/**
 * One immutable dispatch (send) record. The log is append-only and authoritative — a Reversal record
 * corrects an earlier one (referenced via `correctsDispatchId`); it is never an edit of it.
 */
export class DispatchHistoryGridResponse extends IdResponse {
	constructor(
		id: number,
		public reminderId: number,
		public ownerModule: string,
		public kind: string,
		// The occurrence instant this record acted on.
		public occurrenceInstant: Date,
		// When the scanner actually acted on the occurrence.
		public dispatchedAt: Date,
		public outcome: DispatchOutcome,
		// Why it was skipped — only meaningful when the outcome is Skipped.
		public skipReason: SkipReason | null,
		// The resolved notification type it was sent as.
		public notificationType: string | null,
		// The recipient ids it was actually sent to.
		public recipientIds: number[],
		// When this is a Reversal/correction, the id of the dispatch record it supersedes.
		public correctsDispatchId: number | null,
	) {
		super(id)
	}

	get isReversal(): boolean {
		return this.correctsDispatchId !== null
	}

	static fromJson(json: any): DispatchHistoryGridResponse {
		return new DispatchHistoryGridResponse(
			json.id,
			json.reminderId,
			json.ownerModule,
			json.kind,
			new Date(json.occurrenceInstant),
			new Date(json.dispatchedAt),
			json.outcome as DispatchOutcome,
			(json.skipReason ?? null) as SkipReason | null,
			json.notificationType ?? null,
			Array.isArray(json.recipientIds) ? json.recipientIds : [],
			json.correctsDispatchId ?? null,
		)
	}

	static listFromObjects(objects: any[]): DispatchHistoryGridResponse[] {
		return (objects ?? []).map(o => DispatchHistoryGridResponse.fromJson(o))
	}
}
