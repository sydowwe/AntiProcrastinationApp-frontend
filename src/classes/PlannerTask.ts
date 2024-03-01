import { Activity } from "@/classes/Activity";

export class PlannerTask {
  constructor(
    public id: number,
    public startTimestamp: Date,
    public minuteLength: number,
    public name: string,
    public text: string,
    public color: string,
    public activity: Activity | null = null
  ) {}

  static fromObject(object: any) {
    const {
      id = 0,
      startTimestamp = "",
      minuteLength = 0,
      name = "",
      text = "",
      color = "",
    } = object;
    return new PlannerTask(
      id,
      new Date(startTimestamp),
      minuteLength,
      name,
      text,
      color
    );
  }

  static listFromObjects(objects: any[]) {
    return objects.map((item: object) => {
      return this.fromObject(item);
    });
  }

  static frontEndSortFunction() {
    return (a: PlannerTask, b: PlannerTask) => {
      const bEndTimestamp = new Date(b.startTimestamp);
      bEndTimestamp.setUTCMinutes(
        bEndTimestamp.getUTCMinutes() + b.minuteLength,
        0,
        0
      );
      return a.startTimestamp.valueOf() - bEndTimestamp.valueOf();
    };
  }
}

export class PlannerTaskRequest {
  constructor(
    public startTimestamp: Date = new Date(),
    public minuteLength: number | null = null,
    public name: string = "",
    public text: string = "",
    public color: string = "#999",
    public activityId: number | null = null
  ) {}
  static fromEntity(plannerTask: PlannerTask) {
    return new PlannerTaskRequest(
      plannerTask.startTimestamp,
      plannerTask.minuteLength,
      plannerTask.name,
      plannerTask.text,
      plannerTask.color
    );
  }
}
export class PlannerTaskFilter {
  constructor(
      public filterDate: string | null,
      public hourSpan: number,
  ) {}
}
