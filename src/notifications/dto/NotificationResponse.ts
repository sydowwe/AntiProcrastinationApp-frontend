import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'

export class NotificationResponse implements IIdResponse {
	constructor(
		public id: number = 0,
		public type: string = '',
		public title: string = '',
		public body: string = '',
		public createdAt: string = '',
		public isRead: boolean = false,
	) {}

	static fromJson(json: any): NotificationResponse {
		return new NotificationResponse(json.id, json.type, json.title, json.body, json.createdAt, json.isRead)
	}

	static listFromObjects(objects: any[]): NotificationResponse[] {
		return objects.map((item: object) => this.fromJson(item))
	}
}
