import type { INameTextColorIconResponse } from '@/_common/dto/response/interface/INameTextColorIconResponse.ts'

export class Category implements INameTextColorIconResponse {
	constructor(
		public id: number = 0,
		public name: string = '',
		public text: string | null = null,
		public color: string | null = null,
		public icon: string | null = null,
		public role: string | null = null,
		/**
		 * How many activities (archived included) a delete would reclassify. Grid and by-id reads only;
		 * nested inside an `Activity` the server sends `0` and means "not asked for".
		 */
		public usageCount: number = 0,
		/**
		 * Advisory, **not** a prediction of a refusal: the server deletes a used category and blanks the
		 * classification on its activities. So the table never disables delete on it. It confirms with
		 * `usageCount` instead.
		 */
		public canDelete: boolean = true,
	) {}

	static fromJson(object: any) {
		const {
			id = 0,
			name = '',
			text = '',
			color = '',
			icon = '',
			role = '',
			usageCount = 0,
			canDelete = true,
		} = object
		return new Category(id, name, text, color, icon, role, usageCount, canDelete)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => Category.fromJson(item))
	}
}
