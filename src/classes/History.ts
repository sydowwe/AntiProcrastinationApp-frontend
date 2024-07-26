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
      id = 0
    } = object;
    const startTimestamp = new Date(object.startTimestamp);
    const length = TimeLengthObject.fromObject(object.length);
    const activity = Activity.fromObject(object.activity);
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
export class HistoryGroupedByDate{
  constructor(
      public date: Date,
      public historyList: History[],
  ) {}
  static fromObject(object: any){
    const {
    } = object;
    const startTimestamp = new Date(object.date);
    const historyList = History.listFromObjects(object.historyResponseList);
    return new HistoryGroupedByDate(startTimestamp,historyList);
  }
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>this.fromObject(item));
  }
}