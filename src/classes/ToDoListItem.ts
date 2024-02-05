import { UrgencyEntity } from './UrgencyEntity';

export interface BaseToDoListItemEntity{
    id: number,
    name: string,
    text: string,
    isDone: boolean,
}
export class BaseToDoListItemRequest{
  constructor(
    public name: string,
    public text: string,
    public isDone: boolean,
  ) {}
  static fromObject(object: any){
    const {
      name = '',
      text = '',
      isDone = false,
    } = object;  
    return new BaseToDoListItemRequest(name, text, isDone);
  }    
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>this.fromObject(item));
  }
}
export class ToDoListItemEntity implements BaseToDoListItemEntity{
    constructor(
      public id: number,
      public name: string,
      public text: string,
      public isDone: boolean,
      public urgency: UrgencyEntity,
    ) {}
    static fromObject(object: any){
      const {
        id = 0,
        name = '',
        text = '',
        isDone = false,
        urgency = new UrgencyEntity(),
      } = object;  
      return new ToDoListItemEntity(id, name, text, isDone, urgency);
    }    
    static listFromObjects(objects: any[]){
      return objects.map((item:object)=>this.fromObject(item));
    }
  static frontEndSort(todoItems: ToDoListItemEntity[]){
    return todoItems.sort((a, b) => {
      const priorityComparison = a.urgency.priority - b.urgency.priority;
      return priorityComparison !== 0 ? priorityComparison : a.id - b.id;
    });
  }
}
export class ToDoListItemRequest extends BaseToDoListItemRequest{
  constructor(
   
    public name: string = '',
     public text: string = '', 
     public urgencyId: number | null = null, 
     public isDone: boolean = false) {
      super(name,text,isDone);  
  }    
  static fromEntity(obj: ToDoListItemEntity): ToDoListItemRequest {
    return new ToDoListItemRequest(obj.name, obj.text, obj.urgency.id, obj.isDone);
  }
  static fromObject(obj: any): ToDoListItemRequest {
    return new ToDoListItemRequest(obj.name, obj.text, obj.urgencyId, obj.isDone);
  }
}


//=========================================================
export class RoutineToDoListItemEntity implements BaseToDoListItemEntity{
  constructor(
    public id: number,
    public name: string,
    public text: string,
    public isDone: boolean,
    public timePeriod: TimePeriodEntity,
  ) {}
  static fromObject(object: any){
    const {
      id = 0,
      name = '',
      text = '',
      isDone = false,
      timePeriod = new TimePeriodEntity(),
    } = object;  
    return new RoutineToDoListItemEntity(id, name, text ,isDone , timePeriod);
  }    
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>this.fromObject(item));
  }
}

export class RoutineToDoListGroupedList {
  constructor(
    public timePeriod: TimePeriodEntity, 
    public items: RoutineToDoListItemEntity[]) {}

    static fromObject(object: any){
      const {
        timePeriod = new TimePeriodEntity(),
        items = [] as RoutineToDoListItemEntity[],       
      } = object;  
      return new RoutineToDoListGroupedList(timePeriod,items);
    } 
    static listFromObjects(objects: any[]){
      return objects.map((item:object)=>this.fromObject(item));
    }
}
export class RoutineToDoListItemRequest extends BaseToDoListItemRequest{ 
  constructor(public name: string = '',
     public text: string = '', 
     public timePeriodId: number | null = null, 
     public isDone: boolean = false) {  
      super(name,text,isDone);
  }    
  static fromEntity(obj: RoutineToDoListItemEntity): RoutineToDoListItemRequest {
    return new RoutineToDoListItemRequest(obj.name, obj.text, obj.timePeriod.id, obj.isDone);
  }
  static fromObject(obj: any): RoutineToDoListItemRequest {
    return new RoutineToDoListItemRequest(obj.name, obj.text, obj.timePeriodId, obj.isDone);
  }
}
export class TimePeriodEntity{
  constructor(
    public id: number = 0,
    public text: string | null = null,
    public color: string | undefined = undefined,
    public lengthInDays: number = 0,
  ){}
  static fromObject(object: any){
    const {
      id = 0,
      text = '',
      color = '',
      lengthInDays = 0,
    } = object;  
    return new TimePeriodEntity(id, text, color, lengthInDays);
  }   
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>this.fromObject(item));
  }
}

export enum ToDoListKind{
  ROUTINE,
  NORMAL
}