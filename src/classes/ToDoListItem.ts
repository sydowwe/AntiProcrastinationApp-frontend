import { UrgencyEntity } from './UrgencyEntity';


export class BaseToDoListItemEntity{
  constructor(
    public id: number,
    public name: string,
    public text: string,
    public isDone: boolean,
  ) {}
  static fromObject(object: any){
    const {
      id = 0,
      name = '',
      text = '',
      isDone = false,
    } = object;  
    return new BaseToDoListItemEntity(id, name, text, isDone);
  }    
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>this.fromObject(item));
}

}

export class ToDoListItemEntity extends BaseToDoListItemEntity{
    constructor(
      public id: number,
      public name: string,
      public text: string,
      public isDone: boolean,
      public urgency: UrgencyEntity,
    ) {super(id,name,text,isDone)}
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
export class ToDoListItemRequest {
 
  constructor(public name: string = '',
     public text: string = '', 
     public urgencyId: number | null = null, 
     public isDone: boolean = false) {
  
  }    
  static fromEntity(obj: ToDoListItemEntity): ToDoListItemRequest {
    return new ToDoListItemRequest(obj.name, obj.text, obj.urgency.id, obj.isDone);
  }
  static fromObject(obj: any): ToDoListItemRequest {
    return new ToDoListItemRequest(obj.name, obj.text, obj.urgencyId, obj.isDone);
  }
}


//=========================================================
export class RoutineToDoListItemEntity extends BaseToDoListItemEntity{
  constructor(
    public id: number,
    public name: string,
    public text: string,
    public isDone: boolean,
    public timePeriod: TimePeriodEntity,
  ) {super(id,name,text,isDone)}
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
  
}

export class TimePeriodEntity{
  constructor(
    public id: number | null = null,
    public name: string | null = null,
    public color: string | null = null,
    public lengthInDays: number | null = null,
  ){}
}
