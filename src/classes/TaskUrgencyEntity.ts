export class TaskUrgencyEntity{
    constructor(
        public id: number = 0,
        public priority: number = 0,
        public text: string = '',
        public color: string = '',
      ) {}
      static fromObject(object: any){
        const {
          id = 0,
          priority = 0,
          text = '',
          color = '',
        } = object;
        return new TaskUrgencyEntity(id,priority,text,color);
      }
      static listFromObjects(objects: any[]){
        return objects.map((item:object)=>TaskUrgencyEntity.fromObject(item));
      }
      
}