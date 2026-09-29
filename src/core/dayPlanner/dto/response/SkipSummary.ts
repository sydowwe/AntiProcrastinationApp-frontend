import { type BuiltInSkipReason, parseBuiltInSkipReason } from '@/core/dayPlanner/dto/enum/BuiltInSkipReason.ts'
import type { SkipReasonEntry } from '@/core/dayPlanner/utils/skipReasonGroups.ts'

/**
 * One reason group as the server counted it: by key when there is one, otherwise by **exact** stored
 * text. The server does no folding, so "Tired" and "tired" arrive as two groups — the client's
 * `groupSkipReasons` merges them. Both fields null means skipped with no reason.
 */
export class SkipReasonCount implements SkipReasonEntry {
	constructor(
		public readonly reason: string | null,
		public readonly reasonKey: BuiltInSkipReason | null,
		public readonly count: number,
	) {}

	static fromJson(json: any): SkipReasonCount {
		const { reason = null, reasonKey = null, count = 0 } = json ?? {}
		return new SkipReasonCount(reason, parseBuiltInSkipReason(reasonKey), count)
	}

	static listFromObjects(objects: any[]): SkipReasonCount[] {
		return objects.map(item => this.fromJson(item))
	}
}

/** Per planned start hour: everything planned then, in any status, and how much of it was skipped. */
export class SkipHourCount {
	constructor(
		/** 0–23, the task's planned `StartTime.Hour`. A task wrapping midnight counts where it starts. */
		public readonly hour: number,
		/** Every non-background task in any status, Cancelled included — the base rate. */
		public readonly plannedCount: number,
		public readonly skippedCount: number,
	) {}

	static fromJson(json: any): SkipHourCount {
		const { hour = 0, plannedCount = 0, skippedCount = 0 } = json ?? {}
		return new SkipHourCount(hour, plannedCount, skippedCount)
	}

	static listFromObjects(objects: any[]): SkipHourCount[] {
		return objects.map(item => this.fromJson(item))
	}
}

/**
 * `POST planner-task/skip-summary` — the skips over a range. Contract: `prompts/captured-data/backend/B1-*.md`.
 *
 * Same range rules as `PlanVsActualTrend`, deliberately: same request, same 400s, and only days strictly
 * before the user's own today — so the two lines under the calendar always describe the same days.
 * `skippedCount === 0` is the "render nothing" signal. `reasons` counts add up to it; so do the hours'
 * `skippedCount`s. `reasons` is unordered and uncapped; `byStartHour` is ascending and omits hours with
 * nothing planned.
 */
export class SkipSummary {
	constructor(
		public readonly skippedCount: number,
		public readonly reasons: SkipReasonCount[],
		public readonly byStartHour: SkipHourCount[],
	) {}

	static empty(): SkipSummary {
		return new SkipSummary(0, [], [])
	}

	static fromJson(json: any): SkipSummary {
		const { skippedCount = 0, reasons = [], byStartHour = [] } = json ?? {}
		return new SkipSummary(
			skippedCount,
			SkipReasonCount.listFromObjects(reasons),
			SkipHourCount.listFromObjects(byStartHour),
		)
	}
}
