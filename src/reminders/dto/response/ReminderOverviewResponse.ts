/** A labelled count, used for the "upcoming volume by owner area / kind" rollups. */
export class OverviewGroupCount {
	constructor(
		public label: string,
		public count: number,
	) {}

	static fromJson(json: any): OverviewGroupCount {
		return new OverviewGroupCount(json.label ?? '', json.count ?? 0)
	}

	static listFromObjects(objects: any[]): OverviewGroupCount[] {
		return (objects ?? []).map(o => OverviewGroupCount.fromJson(o))
	}
}

/** Rollup of dispatch outcomes over the recent window (last week). */
export class RecentDispatchRollup {
	constructor(
		public sent: number,
		public skipped: number,
		public failed: number,
		public reversed: number,
	) {}

	static fromJson(json: any): RecentDispatchRollup {
		return new RecentDispatchRollup(json?.sent ?? 0, json?.skipped ?? 0, json?.failed ?? 0, json?.reversed ?? 0)
	}

	get total(): number {
		return this.sent + this.skipped + this.failed + this.reversed
	}
}

/**
 * A failed dispatch that has not been superseded by a later correction — the actionable items of the
 * overview. `id` is the dispatch record id; link through to the filtered dispatch history by reminder.
 */
export class FailedDispatchItem {
	constructor(
		public id: number,
		public reminderId: number,
		public ownerModule: string,
		public kind: string,
		public occurrenceInstant: Date,
		public dispatchedAt: Date,
		// Short human reason / error summary.
		public detail: string | null,
	) {}

	static fromJson(json: any): FailedDispatchItem {
		return new FailedDispatchItem(
			json.id,
			json.reminderId,
			json.ownerModule,
			json.kind,
			new Date(json.occurrenceInstant),
			new Date(json.dispatchedAt),
			json.detail ?? null,
		)
	}

	static listFromObjects(objects: any[]): FailedDispatchItem[] {
		return (objects ?? []).map(o => FailedDispatchItem.fromJson(o))
	}
}

/** At-a-glance overview of the reminder system (admin). The dispatch history remains the source of truth. */
export class ReminderOverviewResponse {
	constructor(
		// Upcoming volume grouped by owning area.
		public upcomingByOwnerModule: OverviewGroupCount[],
		// Upcoming volume grouped by kind.
		public upcomingByKind: OverviewGroupCount[],
		// How many occurrences are due within the next `dueSoonDays` days.
		public dueSoonCount: number,
		public dueSoonDays: number,
		// Recent (last-week) dispatch outcomes.
		public recentOutcomes: RecentDispatchRollup,
		public pausedCount: number,
		public cancelledCount: number,
		// Failures needing attention — failed dispatches not yet superseded by a correction.
		public failures: FailedDispatchItem[],
	) {}

	static fromJson(json: any): ReminderOverviewResponse {
		return new ReminderOverviewResponse(
			OverviewGroupCount.listFromObjects(json.upcomingByOwnerModule),
			OverviewGroupCount.listFromObjects(json.upcomingByKind),
			json.dueSoonCount ?? 0,
			json.dueSoonDays ?? 7,
			RecentDispatchRollup.fromJson(json.recentOutcomes),
			json.pausedCount ?? 0,
			json.cancelledCount ?? 0,
			FailedDispatchItem.listFromObjects(json.failures),
		)
	}
}
