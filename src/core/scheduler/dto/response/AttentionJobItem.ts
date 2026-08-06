import type { JobStatus } from '../enum/JobStatus.ts'
import type { RunOutcome } from '../enum/RunOutcome.ts'

/** A job surfaced in the "needs attention" view, with a short human reason in `detail`. */
export class AttentionJobItem {
	constructor(
		public id: number,
		public jobKey: string,
		public description: string | null,
		public ownerModule: string,
		public status: JobStatus,
		public lastRunAt: Date | null,
		public lastOutcome: RunOutcome | null,
		public nextRunAt: Date | null,
		// e.g. an error summary (failed), "overdue by 2h" (overdue), or the missing handler key (orphaned).
		public detail: string | null,
	) {}

	static fromJson(json: any): AttentionJobItem {
		return new AttentionJobItem(
			json.id,
			json.jobKey,
			json.description ?? null,
			json.ownerModule,
			json.status as JobStatus,
			json.lastRunAt ? new Date(json.lastRunAt) : null,
			(json.lastOutcome ?? null) as RunOutcome | null,
			json.nextRunAt ? new Date(json.nextRunAt) : null,
			json.detail ?? null,
		)
	}

	static listFromObjects(objects: any[]): AttentionJobItem[] {
		return (objects ?? []).map(o => AttentionJobItem.fromJson(o))
	}
}
