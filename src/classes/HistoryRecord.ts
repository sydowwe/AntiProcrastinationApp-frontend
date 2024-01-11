import { Activity } from './Activity';
export class HistoryRecord {
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
      return new HistoryRecord(id,startTimestamp,length,activity);
    }
    static listFromObjects(objects: any[]){
      return objects.map((item:object)=>this.fromObject(item));
    }
}