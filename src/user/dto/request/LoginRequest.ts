export class LoginRequest {
	constructor(
		public stayLoggedIn: boolean = false,
		public recaptchaToken?: string,
		public timezone?: string,
	) {}

	static fromJson(obj: any): LoginRequest {
		const { stayLoggedIn, recaptchaToken, timezone } = obj
		return new LoginRequest(stayLoggedIn, recaptchaToken, timezone)
	}
}
