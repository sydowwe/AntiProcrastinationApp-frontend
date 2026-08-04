export class EmailRequest {
	constructor(public email: string = '') {}

	static fromJson(obj: any): EmailRequest {
		const { email } = obj
		return new EmailRequest(email)
	}
}
