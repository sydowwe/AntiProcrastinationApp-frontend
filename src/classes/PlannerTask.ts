import {Activity} from "@/classes/Activity";

export class PlannerTask {
	constructor(
		public id: number,
		public activity: Activity,
		public color: string,
		public start: Date,
		public end: Date,
		public isDone: boolean,
		public isBackground: boolean = false,

		public isDuringBackgroundEvent: boolean = false,
		public gridRowStart: number,
		public gridRowEnd: number,
	) {
	}
	static fromJson(json: any) {
		return new PlannerTask(
			json.id,
			Activity.fromJson(json.activity),
			json.color,
			new Date(json.start),
			new Date(json.end),
			json.isDone,
			json.isBackground,
			false,
			0,
			0
		);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => {
			return this.fromJson(item);
		});
	}

	static frontEndSortFunction() {
		return (a: PlannerTask, b: PlannerTask) => {
			return a.start.valueOf() - b.end.valueOf();
		};
	}

}

export class PlannerTaskRequest {
	constructor(
		public activityId: number | null = null,
		public start: Date = new Date(),
		public end: Date = new Date(),
		public color: string = "#999",
		public isDone: boolean = false,
		public isBackground: boolean = false,
	) {	}
	static fromEntity(plannerTask: PlannerTask) {
		return new PlannerTaskRequest(
			plannerTask.activity.id,
			plannerTask.start,
			plannerTask.end,
			plannerTask.color,
			plannerTask.isDone,
			plannerTask.isBackground,
		);
	}
	static fromSpan(start: Date, end: Date) {
		const task = new PlannerTaskRequest();
		task.start = start;
		task.end = end;
		return task;
	}
}

export class PlannerTaskFilter {
	constructor(
		public filterDate: string | null,
		public hourSpan: number,
	) {
	}
}
