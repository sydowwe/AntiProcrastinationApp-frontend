import { UrgencyEntity } from './UrgencyEntity';

export class ToDoListItemEntity {
    constructor(
      public id: number,
      public name: string,
      public text: string,
      public urgency: UrgencyEntity,
      public isDone: boolean,
    ) {}
}