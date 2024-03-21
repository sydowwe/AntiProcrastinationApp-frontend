import { Activity } from './Activity';
import {TimeLengthObject} from '@/classes/TimeUtils';
export class History {
  constructor(
      public id: number,
      public startTimestamp: Date,
      public length: TimeLengthObject,
      public activity: Activity,
  ) {}
  static fromObject(object: any){
    const {
      id = 0,
      startTimestamp = new Date(),
      length = new TimeLengthObject(),
      activity = new Activity
    } = object;
    return new History(id,startTimestamp,length,activity);
  }
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>this.fromObject(item));
  }
}

export class HistoryRequest {
  constructor(
      public startTimestamp: Date,
      public length: TimeLengthObject,
      public activityId: number,
  ) {}
  static fromObject(object: any){
    const {
      startTimestamp = new Date(),
      length = new TimeLengthObject(),
      activityId = 0
    } = object;
    return new HistoryRequest(startTimestamp,length,activityId);
  }
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>this.fromObject(item));
  }
}

export class HistoryFilter{
    constructor(
      public activityId = null as number | null,
        public roleId = null as number | null,
        public categoryId = null as number | null,
        public isFromToDoList = false as boolean | null,
        public dateFrom = null as Date | null,
        public dateTo = new Date() as Date | null,
        public hoursBack = 24 as number | null
      ){
        const tmp = new Date();
        tmp.setDate(new Date().getDate()-3);
        this.dateFrom = tmp;
      }
}