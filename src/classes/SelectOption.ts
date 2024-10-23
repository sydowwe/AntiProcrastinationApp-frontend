export class SelectOption {
    constructor(
      public id: number,
      public text : string,
    ) {}
    static fromObject(object: any){
      const {
        id = 0,
        text = '',
      } = object;
      return new SelectOption(id,text);
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