export class User {
    constructor(
      public id: number = 0,
      public name: string = '',
      public surname: string = '',
      public email: string = '',
      public has2FA: boolean = false,
      public scratchCodes: null | number[] = null
    ) {}    
    static fromObject(object: any){
      const {
        id = 0,
        name = '',
        surname = '',
        email = '',
        has2FA = false,
        scratchCodes = null
      } = object;  
      return new User(id, name, surname, email, has2FA, scratchCodes);
    }
}
export class UserRequest {
  constructor(
    public name: string = '',
    public surname: string = '',
    public email: string = '',
    public has2FA: boolean = false,
  ) {}    
  static fromUser(user: User): UserRequest {
    return new UserRequest(
      user.name,
      user.surname,
      user.email,
      user.has2FA
    );
  }
}

export class UserStoreItem{
  constructor(
    public id: number = 0,    
    public email: string = '',
    public token: string = '',
  ) {}  
}