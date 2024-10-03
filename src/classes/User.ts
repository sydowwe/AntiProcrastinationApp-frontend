export class User {
    constructor(
      public id: number = 0,
      public email: string = '',
      public twoFactorEnabled: boolean = false,
    ) {}
    static fromObject(object: any){
      const {
        id = 0,
        email = '',
        twoFactorEnabled = false,
      } = object;
      return new User(id, email, twoFactorEnabled);
    }
}

export class UserStoreItem{
  constructor(
    public id: number = 0,    
    public email: string = '',
    public isAuthenticated: boolean = false,
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
      public timezone: string = '',
      public currentLocale: AvailableLocales = AvailableLocales.SK,
  ) {
    super(email);
  }
}
export class RegistrationRequest extends EmailRequest {
  constructor(

      email: string = '',
      public twoFactorEnabled: boolean = false,
      public password: string = '',
      public recaptchaToken: string = '',
      public currentLocale: AvailableLocales = AvailableLocales.SK,
      public timezone: string = '',
  ) {
    super(email);
  }
}
export enum AvailableLocales{
  SK='SK',EN='EN',CZ='CZ'
}