import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'

/**
 * An open task from one of the user's last seven days — `GET planner-task/carry-over-candidates`. The
 * task alone carries only a calendar id, so the day comes alongside it.
 */
export class CarryOverCandidate {
	constructor(
		/** The task's day, `YYYY-MM-DD`, on the user's calendar. */
		public readonly date: string,
		public readonly task: PlannerTask,
	) {}

	static fromJson(json: any): CarryOverCandidate {
		return new CarryOverCandidate(json.date, PlannerTask.fromJson(json.task))
	}

	static listFromObjects(objects: any[]): CarryOverCandidate[] {
		return objects.map(item => CarryOverCandidate.fromJson(item))
	}
}
