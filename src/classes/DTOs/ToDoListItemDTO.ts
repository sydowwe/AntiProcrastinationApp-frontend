import { ToDoListItemEntity } from "../ToDoListItemEntity";

export class ToDoListItemDTO {
 
    constructor(public name: string, public text: string, public urgencyId: number | null, public isDone: boolean) {
    
    }    
    static fromEntity(obj: ToDoListItemEntity): ToDoListItemDTO {
      return new ToDoListItemDTO(obj.name, obj.text, obj.urgency.id, obj.isDone);
    }
    static fromObject(obj: any): ToDoListItemDTO {
      return new ToDoListItemDTO(obj.name, obj.text, obj.urgencyId, obj.isDone);
    }
  }