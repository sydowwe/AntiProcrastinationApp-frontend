import type {Role} from '@/dtos/response/Role.ts';

export class RoleRequest {
	constructor(
		public name: string = '',
		public text: string | null = null,
		public color: string | null = null,
		// public icon: string | null = null,
	) {
	}

	static fromResponse(response: Role) {
		return new RoleRequest(response.name, response.text, response.color,)
	}
}