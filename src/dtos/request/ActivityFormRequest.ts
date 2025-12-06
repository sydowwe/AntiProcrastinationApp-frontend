export class ActivityFormRequest {
	constructor(
		public activityId: number | null = null,
		public roleId: number | null = null,
		public categoryId: number | null = null,
		public isUnavoidable: boolean | null = null,
		public isFromToDoList: boolean | null = null,
		public taskPriorityId: number | null = null,
		public isFromRoutineToDoList: boolean | null = null,
		public routineTimePeriodId: number | null = null,
	) {
	}

	static get createEmpty() {
		return new ActivityFormRequest();
	}
}
