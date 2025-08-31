export class User {
    constructor(
      public id: number = 0,
      public email: string = '',
      public twoFactorEnabled: boolean = false,
    ) {}
    static fromJson(object: any){
      const {
        id = 0,
        email = '',
        twoFactorEnabled = false,
      } = object;
      return new User(id, email, twoFactorEnabled);
    }
}

export class EmailRequest {
  constructor(
    public email: string = '') {
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
export class LoginRequest {
  constructor(
      public stayLoggedIn: boolean = false,
      public recaptchaToken: string = '',
      public timezone: string = '',
  ) {}
}
export class PasswordSignInRequest extends LoginRequest {
  constructor(
      stayLoggedIn: boolean = false,
      recaptchaToken: string = '',
      timezone: string = '',
      public email: string = '',
      public password: string = '',
  ) {
    super(stayLoggedIn, recaptchaToken, timezone);
  }
}
export class GoogleSignInRequest extends PasswordSignInRequest {
  constructor(
      stayLoggedIn: boolean = false,
      recaptchaToken: string = '',
      timezone: string = '',
      public code: string | null = null,
  ) {
    super(stayLoggedIn, recaptchaToken, timezone);
  }
}
export enum AvailableLocales{
  SK='SK',EN='EN',CZ='CZ'
}