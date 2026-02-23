import type {Role} from '@/dtos/response/activity/Role.ts';

export class RoleRequest {
	constructor(
		public name: string = '',
		public text: string | null = null,
		public color: string | null = null,
		// public icon: string | null = null,
	) {
	}

	static fromEntity(entity: Role) {
		return new RoleRequest(entity.name, entity.text, entity.color,)
	}
}