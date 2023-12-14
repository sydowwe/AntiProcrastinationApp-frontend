import { Activity } from './DTOs/Activity';
export class ActivityRecord {
    constructor(
      public id: number,
      public startTimestamp: Date,
      public length: number,
      public activity: Activity,
    ) {}
}