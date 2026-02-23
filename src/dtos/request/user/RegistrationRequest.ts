import {AvailableLocales} from '@/dtos/enum/AvailableLocales.ts';
import {EmailRequest} from './EmailRequest.ts';

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
