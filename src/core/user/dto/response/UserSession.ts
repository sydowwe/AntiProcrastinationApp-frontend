import type { IMyResponse } from '@/dtos/response/interface/IMyResponse.ts'

export class UserSession implements IMyResponse {
	constructor(
		public id: string = '',
		public device: string = '',
		public browser: string = '',
		public ip: string = '',
		public lastUsedAt: string = '',
		public createdAt: string = '',
		public isCurrent: boolean = false,
	) {}

	static fromJson(o: any): UserSession {
		const { id = '', device = '', browser = '', ip = '', lastUsedAt = '', createdAt = '', isCurrent = false } = o
		return new UserSession(id, device, browser, ip, lastUsedAt, createdAt, isCurrent)
	}

	static listFromObjects(arr: any[]): UserSession[] {
		return (arr ?? []).map(UserSession.fromJson)
	}
}
