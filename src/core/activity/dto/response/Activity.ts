import { Category } from './Category.ts'
import { Role } from './Role.ts'

export class Activity {
	constructor(
		public id: number,
		public name: string,
		public text: string | null = null,
		public isUnavoidable: boolean,
		public role: Role,
		public category: Category | null = null,
		/**
		 * Archived activities keep every history record, to-do item and planner task pointing at them and
		 * keep rendering their name there; they only disappear from the pickers. See
		 * `prompts/activity/backend/A9-backend.md`.
		 */
		public isArchived: boolean = false,
		/** How many rows across every referencing entity type point at this activity. Lifecycle only. */
		public usageCount: number = 0,
		/** False when a hard delete would be refused because something still references it. */
		public canDelete: boolean = false,
	) {}

	/**
	 * The last three fields are lifecycle data the settings table needs and nothing else does, so the
	 * nested `activity` payloads carried by planner tasks, to-do items and history rows are not required
	 * to send them. Their defaults are the safe reading of a missing value: not archived, unused, and
	 * **not** deletable — offering a delete that the server will refuse is the failure this replaces.
	 */
	static fromJson(object: any) {
		const {
			id = 0,
			name = '',
			text = null,
			isUnavoidable = false,
			isArchived = false,
			usageCount = 0,
			canDelete = false,
		} = object
		return new Activity(
			id,
			name,
			text,
			isUnavoidable,
			Role.fromJson(object.role),
			object.category ? Category.fromJson(object.category) : null,
			isArchived,
			usageCount,
			canDelete,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}
