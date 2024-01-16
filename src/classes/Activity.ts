import { Category } from './Category';
import { Role } from "./Role";

export class Activity{
  constructor(
    public id: number = 0,
    public name: string | null = null,
    public text: string | null = null,
    public isOnToDoList: boolean = false,
    public isUnavoidable: boolean = false,
    public role: Role | null = null,
    public category: Category | null = null
  ) {}
  static fromObject(object: any){
    const {
      id = 0,
      name = '',
      text = '',
      isOnToDoList = false,
      isUnavoidable = false,
      role = new Role(),
      category = new Category()
    } = object;  
    return new Activity(id, name, text, isOnToDoList,isUnavoidable,role,category );
  }
  static listFromObjects(objects: any[]){
    return objects.map((item:object)=>this.fromObject(item));
}
}
export class ActivityRequest {

  constructor( public name: string,
  public text: string | null = null,
  public isOnToDoList: boolean = false,
  public isUnavoidable: boolean = false,
  public roleId: number,
  public category: number) {

  }    
  static fromObject(object: any){
  const {
    name = '',
    text = '',
    isOnToDoList = false,
    isUnavoidable = false,
    roleId = 0,
    categoryId = 0
  } = object;  
  return new ActivityRequest(name, text, isOnToDoList,isUnavoidable,roleId,categoryId );
  }
}