export class LoginRequest {
  constructor(
      public stayLoggedIn: boolean = false,
      public recaptchaToken: string = '',
      public timezone: string = '',
  ) {}
}
