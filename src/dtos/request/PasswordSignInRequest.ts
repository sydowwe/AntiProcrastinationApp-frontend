import {LoginRequest} from './LoginRequest';

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
