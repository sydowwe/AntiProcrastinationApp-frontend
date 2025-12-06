export class BasePlannerTaskRequest {
	constructor(
		public startTime?: string,
		public endTime?: string,
		public isBackground?: boolean,
		public isOptional?: boolean,
		public location: string | null = null,
		public notes: string | null = null,
		public activityId?: number,
		public priorityId: number | null = null
	) {}
}