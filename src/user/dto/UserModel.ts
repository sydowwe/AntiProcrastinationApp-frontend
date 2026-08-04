import { IdResponse } from '@/_common/dto/response/base/IdResponse.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'

export class UserRequest {
	constructor(
		public email: string = '',
		public name: string = '',
		public surname: string = '',
		public roleId?: number,
		public phoneNumber: string | null = null,
		public microsoftAccountId: string | null = null,
	) {}

	static fromResponse(response: UserResponse) {
		return new UserRequest(
			response.email,
			response.name,
			response.surname,
			undefined,
			response.phoneNumber,
			response.microsoftAccountId,
		)
	}
}

export class UserResponse extends IdResponse {
	constructor(
		id: number,
		public personalNumber: number,
		public email: string,
		public name: string,
		public surname: string,
		public lastLogin: Date | null,
		public phoneNumber: string | null,
		public microsoftAccountId: string | null,
	) {
		super(id)
	}

	public get fullName(): string {
		return `${this.name} ${this.surname}`
	}

	static fromJson(json: any) {
		return new UserResponse(
			json.id,
			json.personalNumber,
			json.email,
			json.name,
			json.surname,
			json.lastLogin ? new Date(json.lastLogin) : null,
			json.phoneNumber,
			json.microsoftAccountId,
		)
	}

	static listFromJsonList(jsonList: any[]) {
		return jsonList.map((item: object) => this.fromJson(item))
	}
}

export class UserFilterRequest {
	constructor(
		public name: string | null = null,
		public phoneNumber: string | null = null,
	) {}
}

export class LoggedInUser {
	constructor(
		public email: string,
		public fullName: string,
		public role: UserRoleEnum,
	) {}

	static fromJson(json: any) {
		return new LoggedInUser(json.email, json.fullName, convertToEnum(UserRoleEnum, json.role))
	}
}

export class UserLoginRequest {
	constructor(
		public stayLoggedIn: boolean = false,
		public email: string = '',
		public password: string = '',
	) {}
}

export enum UserRoleEnum {
	Employee = 'Employee',
	Hr = 'Hr',
	Admin = 'Admin',
	RootAdmin = 'RootAdmin',
}
