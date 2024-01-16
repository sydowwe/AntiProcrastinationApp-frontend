import { UrgencyEntity } from './UrgencyEntity';

export class ToDoListItemEntity{
    constructor(
      public id: number,
      public name: string,
      public text: string,
      public urgency: UrgencyEntity,
      public isDone: boolean,
    ) {}
    static fromObject(object: any){
      const {
        id = 0,
        name = '',
        text = '',
        urgency = new UrgencyEntity(),
        isDone = false,
      } = object;  
      return new ToDoListItemEntity(id, name, text, urgency,isDone);
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