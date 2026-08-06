import { AttentionJobItem } from './AttentionJobItem.ts'

/** Rollup of run outcomes over the last day. */
export class RecentOutcomeRollup {
	constructor(
		public succeeded: number,
		public failed: number,
		public skipped: number,
		public vetoed: number,
	) {}

	static fromJson(json: any): RecentOutcomeRollup {
		return new RecentOutcomeRollup(json?.succeeded ?? 0, json?.failed ?? 0, json?.skipped ?? 0, json?.vetoed ?? 0)
	}

	get total(): number {
		return this.succeeded + this.failed + this.skipped + this.vetoed
	}
}

/** Health summary for the "needs attention" view. */
export class SchedulerNeedsAttentionResponse {
	constructor(
		public activeCount: number,
		public pausedCount: number,
		public removedCount: number,
		public failedJobs: AttentionJobItem[],
		public overdueJobs: AttentionJobItem[],
		public orphanedJobs: AttentionJobItem[],
		public recentOutcomes: RecentOutcomeRollup,
	) {}

	static fromJson(json: any): SchedulerNeedsAttentionResponse {
		return new SchedulerNeedsAttentionResponse(
			json.activeCount ?? 0,
			json.pausedCount ?? 0,
			json.removedCount ?? 0,
			AttentionJobItem.listFromObjects(json.failedJobs),
			AttentionJobItem.listFromObjects(json.overdueJobs),
			AttentionJobItem.listFromObjects(json.orphanedJobs),
			RecentOutcomeRollup.fromJson(json.recentOutcomes),
		)
	}
}
