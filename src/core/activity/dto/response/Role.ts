import type { INameTextColorIconResponse } from '@/_common/dto/response/interface/INameTextColorIconResponse.ts'
import type { SystemActivityRole } from '@/core/activity/dto/enum/SystemActivityRole.ts'

export class Role implements INameTextColorIconResponse {
	constructor(
		public id: number = 0,
		public name: string = '',
		public text: string | null = null,
		public color: string | null = null,
		public icon: string | null = null,
		/**
		 * Set on the three roles the app itself references, `null` on anything the user created. The
		 * server refuses to delete a keyed role and preserves the key across renames, so this is the only
		 * reliable way to tell a system role apart — `name` is user-editable and may be localized.
		 */
		public systemKey: SystemActivityRole | null = null,
	) {}

	static fromJson(object: any) {
		const { id = 0, name = '', text = '', color = '', icon = '', systemKey = null } = object
		return new Role(id, name, text, color, icon, systemKey)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => Role.fromJson(item))
	}
}
