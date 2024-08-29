export class SelectOption {
    constructor(
      public id: number,
      public label : string,    
    ) {}
    static fromObject(object: any){
      const {
        id = 0,
        label = '',
      } = object;
      return new SelectOption(id,label);
    }
    static listFromObjects(objects: any[]){
      return objects.map((item:object)=>this.fromObject(item));
    }
    static fromIdName(object: any){
        const {
            id = 0,
            name = '',
        } = object;
        return new SelectOption(id,name);
    }
    }