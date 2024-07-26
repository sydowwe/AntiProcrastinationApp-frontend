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
    public currentLocale: AvailableLocales = AvailableLocales.SK
  ) {}  
}

export class EmailRequest {
  constructor(
    public email: string = '') {
  }
}
export class LoginRequest extends EmailRequest {
  constructor(
      email: string = '',
      public password: string = '',
      public stayLoggedIn: boolean = false,
      public recaptchaToken: string = '',
      public timezone: string | null = null
  ) {
    super(email);
  }
}
export class RegistrationRequest extends UserRequest {
  constructor(
      name: string = '',
      surname: string = '',
      email: string = '',
      has2FA: boolean = false,
      public password: string = '',
      public recaptchaToken: string = '',
      public currentLocale: AvailableLocales = AvailableLocales.SK,
  ) {
    super(name, surname, email, has2FA);
  }
}
export enum AvailableLocales{
  SK='SK',EN='EN',CZ='CZ'
}