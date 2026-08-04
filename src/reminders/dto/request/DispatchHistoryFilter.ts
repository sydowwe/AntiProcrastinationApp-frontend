import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { DispatchOutcome } from '../enum/DispatchOutcome.ts'

/**
 * Dispatch (send) history filter. Filtering by recipient matches the reminder's *current* recipients;
 * each record still shows the exact recipient ids it was actually sent to.
 */
export class DispatchHistoryFilter implements IFilterRequest {
	constructor(
		public reminderId: number | null = null,
		public ownerModule: string | null = null,
		public recipientUserId: number | null = null,
		public outcome: DispatchOutcome | null = null,
		public dispatchedFrom: Date | null = null,
		public dispatchedTo: Date | null = null,
	) {}
}
