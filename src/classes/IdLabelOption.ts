export class IdLabelOption {
    constructor(
      public id: number,
      public label : string,    
    ) {}
    static fromObject(object: any){
      const {
        id = 0,
        label = '',
      } = object;
      return new IdLabelOption(id,label);
    }
    static listFromObjects(objects: any[]){
      return objects.map((item:object)=>this.fromObject(item));
    }
    }