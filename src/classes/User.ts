export class User {
    constructor(
      public id: number = 0,
      public name: string = '',
      public surname: string = '',
      public email: string = '',
      public twoFactorEnabled: boolean = false,
    ) {}
    static fromObject(object: any){
      const {
        id = 0,
        name = '',
        surname = '',
        email = '',
        twoFactorEnabled = false,
      } = object;
      return new User(id, name, surname, email, twoFactorEnabled);
    }
}
export class UserRequest {
  constructor(
    public name: string = '',
    public surname: string = '',
    public email: string = '',
    public twoFactorEnabled: boolean = false,
  ) {}
  static fromUser(user: User): UserRequest {
    return new UserRequest(
      user.name,
      user.surname,
      user.email,
      user.twoFactorEnabled,
    );
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
export class RegistrationRequest extends UserRequest {
  constructor(
      name: string = '',
      surname: string = '',
      Email: string = '',
      TwoFactorEnabled: boolean = false,
      public password: string = '',
      public recaptchaToken: string = '',
      public currentLocale: AvailableLocales = AvailableLocales.SK,
      public timezone: string = '',
  ) {
    super(name, surname, Email, TwoFactorEnabled);
  }
}
export enum AvailableLocales{
  SK='SK',EN='EN',CZ='CZ'
}