import type {Role} from '@/dtos/response/Role.ts';

export class RoleRequest {
	constructor(
		public name: string = '',
		public text: string | null = null,
		public color: string = '#5C6BC0',
		// public icon: string | null = null,
	) {
	}

	static fromEntity(entity: Role) {
		return new RoleRequest(entity.name, entity.text, entity.color,)
	}
}