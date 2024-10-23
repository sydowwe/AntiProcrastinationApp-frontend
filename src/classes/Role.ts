export class Role {
  constructor(
    public id: number = 0,
    public name : string = '',
    public text: string | null = null,
    public color: string | null = null,
    public icon: string | null = null,
  ) {}
  static fromObject(object: any){
    const {
      id = 0,
      name = '',
      text = '',
      color = '',
      icon = '',      
    } = object;  
    return new Role(id, name, text, color,
      icon,
     );
  }
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>Role.fromObject(item));
  }
  }

export class RoleRequest {
  constructor(
      public name : string = '',
      public text: string | null = null,
      public color: string | null = null,
      // public icon: string | null = null,
  ) {}
  static fromObject(object: any){
    const {
      name = '',
      text = '',
      color = '',
      // icon = '',
    } = object;
    return new Role(name, text, color,
        // icon,
    );
  }
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>Role.fromObject(item));
  }
}