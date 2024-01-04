import { Activity } from './DTOs/Activity';
export class ActivityRecord {
    constructor(
      public id: number,
      public startTimestamp: Date,
      public length: number,
      public activity: Activity,
    ) {}
    static fromObject(object: any){
      const {
        id = 0,
        startTimestamp = new Date(),
        length = 0,
        activity = new Activity
      } = object;
      return new ActivityRecord(id,startTimestamp,length,activity);
    }
}