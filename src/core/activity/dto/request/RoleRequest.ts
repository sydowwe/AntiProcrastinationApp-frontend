import type { Role } from '@/core/activity/dto/response/Role.ts'

export class RoleRequest {
	constructor(
		public name: string = '',
		public text: string | null = null,
		// The server refuses an empty colour and accepts only a `ColorPalette` name (B10), so this
		// seeds one rather than defaulting to null — nothing in `ColorPicker` writes one unprompted.
		public color: string = 'blue',
		public icon: string | null = null,
	) {}

	static fromEntity(entity: Role) {
		return new RoleRequest(entity.name, entity.text, entity.color ?? 'blue', entity.icon)
	}
}
