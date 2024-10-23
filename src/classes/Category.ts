export class Category {
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
    return new Category(id, name, text, color,
      icon,
     );
  }
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>Category.fromObject(item));
  }
}
export class CategoryRequest {
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
    return new Category(name, text, color,
        // icon,
    );
  }
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>Category.fromObject(item));
  }
}
