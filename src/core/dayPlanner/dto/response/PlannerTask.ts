import { type IBasePlannerTask } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
import { Activity } from '@/core/activity/dto/response/Activity.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
import type { TemplatePlannerTask } from '@/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts'
import { TaskImportance } from '@/core/dayPlanner/dto/response/TaskImportance.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { type BuiltInSkipReason, parseBuiltInSkipReason } from '@/core/dayPlanner/dto/enum/BuiltInSkipReason.ts'

export class PlannerTask implements IBasePlannerTask<PlannerTaskRequest> {
	constructor(
		public id: number,
		public startTime: Time,
		public endTime: Time,
		public calendarId: number,
		public isBackground: boolean,
		public isDone: boolean,
		public activity: Activity,
		public location: string | null,
		public notes: string | null,
		public importance: TaskImportance | null,
		public color: string,
		public status: PlannerTaskStatus,
		public actualStartTime: Time | null = null,
		public actualEndTime: Time | null = null,
		/**
		 * The template line this task was applied from (OP15). Written only by an apply, so a task added by hand,
		 * or one applied before the server recorded it, reads null. The line may since have been deleted: this is
		 * provenance, not a reference.
		 */
		public sourceTemplateTaskId: number | null = null,
		public skipReason: string | null = null,
		/** One of the app's own reasons, stored as a key (B1). At most one of this and `skipReason` is set. */
		public skipReasonKey: BuiltInSkipReason | null = null,
		public todoListItemId: number | null = null,
		public gridRowStart: number = -1,
		public gridRowEnd: number = -1,
		public isDuringBackgroundTask: boolean = false,
		/** The day (`YYYY-MM-DD`) the task was first planned for, once it has been carried over; else null. */
		public originalDate: string | null = null,
		/** How many times the task has been carried over to a later day. "Pushed 4×" is the cue to split or drop it. */
		public carryOverCount: number = 0,
		/**
		 * The repeating rule that put this block on the plan by itself (FO6), or null. Like the template line, it is
		 * provenance: a copy of the day drops it, and deleting the rule leaves the block with null.
		 */
		public sourceRepeatingTaskId: number | null = null,
	) {}

	/** Derived, not sent: the server has no `isFromTemplate` member, so reading one off the wire was always undefined. */
	get isFromTemplate(): boolean {
		return this.sourceTemplateTaskId != null
	}

	get isFromRepeatingTask(): boolean {
		return this.sourceRepeatingTaskId != null
	}

	get isTaskOneRow(): boolean {
		return this.gridRowEnd - this.gridRowStart === 1
	}

	toRequest(): PlannerTaskRequest {
		return PlannerTaskRequest.fromEntity(this)
	}

	toSpan(): { startTime: Time; endTime: Time } {
		return { startTime: this.startTime, endTime: this.endTime }
	}

	static fromTemplateTask(calendarId: number, templateTask: TemplatePlannerTask): PlannerTask {
		return new PlannerTask(
			-templateTask.id,
			templateTask.startTime,
			templateTask.endTime,
			calendarId,
			templateTask.isBackground,
			false,
			templateTask.activity,
			templateTask.location,
			templateTask.notes,
			templateTask.importance,
			templateTask.color,
			PlannerTaskStatus.NotStarted,
			null,
			null,
			templateTask.id,
		)
	}

	static fromJson(json: any): PlannerTask {
		return new PlannerTask(
			json.id,
			Time.fromJson(json.startTime),
			Time.fromJson(json.endTime),
			json.calendarId,
			json.isBackground,
			json.isDone ?? false,
			Activity.fromJson(json.activity),
			json.location,
			json.notes,
			json.importance ? TaskImportance.fromJson(json.importance) : null,
			json.color,
			convertToEnum(PlannerTaskStatus, json.status),
			json.actualStartTime ? Time.fromJson(json.actualStartTime) : null,
			json.actualEndTime ? Time.fromJson(json.actualEndTime) : null,
			json.sourceTemplateTaskId ?? null,
			json.skipReason ?? null,
			parseBuiltInSkipReason(json.skipReasonKey),
			// The server's spelling (`PlannerTaskResponse.TodolistItemId`). Read as `todoListItemId` this was
			// always null, and a PUT built from it (`toRequest`) would have unlinked the task.
			json.todolistItemId ?? null,
			0,
			0,
			false,
			json.originalDate ?? null,
			json.carryOverCount ?? 0,
			json.sourceRepeatingTaskId ?? null,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}
