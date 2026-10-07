import { Time } from '@/_common/dto/dto/Time.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { PlannerTaskSlipState } from '@/core/dayPlanner/dto/enum/PlannerTaskSlipState.ts'

/** One block the re-plan moves within today. `task` is the block as it stands, so its own times are where it moves from. */
export class DayReplanMove {
	constructor(
		public readonly task: PlannerTask,
		public readonly state: PlannerTaskSlipState,
		public readonly startTime: Time,
		public readonly endTime: Time,
	) {}

	static fromJson(json: any): DayReplanMove {
		const { task, state, startTime, endTime } = json ?? {}
		return new DayReplanMove(
			PlannerTask.fromJson(task),
			convertToEnum(PlannerTaskSlipState, state) ?? PlannerTaskSlipState.Upcoming,
			Time.fromJson(startTime),
			Time.fromJson(endTime),
		)
	}

	static listFromObjects(objects: any[]): DayReplanMove[] {
		return objects.map(item => DayReplanMove.fromJson(item))
	}
}

/** One block with no room left today. The apply has to be told what to do with it. */
export class DayReplanWontFit {
	constructor(
		public readonly task: PlannerTask,
		public readonly state: PlannerTaskSlipState,
		/** Its importance is the "optional" level. Those give way first, and default to a skip. */
		public readonly isOptional: boolean,
	) {}

	static fromJson(json: any): DayReplanWontFit {
		const { task, state, isOptional = false } = json ?? {}
		return new DayReplanWontFit(
			PlannerTask.fromJson(task),
			convertToEnum(PlannerTaskSlipState, state) ?? PlannerTaskSlipState.Missed,
			isOptional,
		)
	}

	static listFromObjects(objects: any[]): DayReplanWontFit[] {
		return objects.map(item => DayReplanWontFit.fromJson(item))
	}
}

/**
 * `POST calendar/day-plan/{date}/replan`: what re-planning the rest of today would do (FO4). Nothing is
 * written until the apply, which echoes `previewToken` back.
 *
 * Nothing slipped is a normal 200 with `hasChanges` false, never an error.
 */
export class DayReplanPreview {
	constructor(
		public readonly date: string,
		/** Opaque. Good for ten minutes, and only for the day as it stood when the preview was made. */
		public readonly previewToken: string,
		/** The user's now, rounded up to the minute: where the packing starts. */
		public readonly packedFrom: Time,
		/** Bed time, or 23:59 when bed time is midnight or after it. */
		public readonly windowEnd: Time,
		/** Ordered by new start. A block that keeps its slot is absent. */
		public readonly moves: DayReplanMove[],
		/** Optional blocks first, then in the day's order. */
		public readonly wontFit: DayReplanWontFit[],
		public readonly hasChanges: boolean,
	) {}

	static fromJson(json: any): DayReplanPreview {
		const {
			date = '',
			previewToken = '',
			packedFrom = null,
			windowEnd = null,
			moves = [],
			wontFit = [],
			hasChanges = false,
		} = json ?? {}
		return new DayReplanPreview(
			date,
			previewToken,
			Time.fromJson(packedFrom),
			Time.fromJson(windowEnd),
			DayReplanMove.listFromObjects(moves),
			DayReplanWontFit.listFromObjects(wontFit),
			hasChanges,
		)
	}
}
