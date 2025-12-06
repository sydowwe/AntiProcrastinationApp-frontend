import {PasswordSignInRequest} from './PasswordSignInRequest';

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
